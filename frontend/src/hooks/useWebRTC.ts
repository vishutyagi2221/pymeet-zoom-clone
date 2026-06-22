import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { RoomParticipant } from "../types";

interface RemoteStream {
  sid: string;
  stream: MediaStream;
  participant?: RoomParticipant;
}

const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    ...(turnUrl ? [{ urls: turnUrl, username: turnUsername, credential: turnCredential }] : []),
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
};

const shouldInitiate = (localSid: string | undefined, remoteSid: string) => Boolean(localSid && localSid.localeCompare(remoteSid) < 0);

const VIRTUAL_CAMERA_PATTERN = /phone|mobile|virtual|phone link|link to windows|continuity|droidcam|iriun|obs/i;
const PHYSICAL_CAMERA_PATTERN = /integrated|webcam|usb|hd camera|facetime/i;
const CAMERA_STORAGE_KEY = "pymeet-camera-device-id";

async function preferredCameraConstraints(): Promise<MediaTrackConstraints | boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const savedCameraId = window.localStorage.getItem(CAMERA_STORAGE_KEY);
    const savedCamera = cameras.find((device) => device.deviceId === savedCameraId);
    const physicalCamera = savedCamera || cameras.find((device) =>
      PHYSICAL_CAMERA_PATTERN.test(device.label) && !VIRTUAL_CAMERA_PATTERN.test(device.label)
    ) || cameras.find((device) => !VIRTUAL_CAMERA_PATTERN.test(device.label));

    if (physicalCamera?.deviceId) {
      return { deviceId: { exact: physicalCamera.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } };
    }
  } catch {
    // Device labels may be hidden until the first permission grant.
  }

  return { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } };
}

export function useWebRTC(socket: Socket | null, meetingId: string, enabled: boolean) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const participantsRef = useRef<RoomParticipant[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const iceCandidateQueues = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const disconnectTimers = useRef<Map<string, number>>(new Map());
  const restartAttempts = useRef<Map<string, number>>(new Map());

  const requestMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("Camera and microphone require a secure HTTPS connection.");
      setCameraEnabled(false);
      setMicEnabled(false);
      return false;
    }

    try {
      const video = await preferredCameraConstraints();
      let stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      const availableCameras = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput");
      setVideoDevices(availableCameras);

      const currentTrack = stream.getVideoTracks()[0];
      const physicalCamera = availableCameras.find((device) =>
        PHYSICAL_CAMERA_PATTERN.test(device.label) && !VIRTUAL_CAMERA_PATTERN.test(device.label)
      );
      if (currentTrack && physicalCamera && VIRTUAL_CAMERA_PATTERN.test(currentTrack.label) && physicalCamera.deviceId !== currentTrack.getSettings().deviceId) {
        try {
          const physicalStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: physicalCamera.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          currentTrack.stop();
          stream = new MediaStream([...physicalStream.getVideoTracks(), ...stream.getAudioTracks()]);
        } catch {
          // The camera picker remains available if automatic switching is blocked.
        }
      }

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      setSelectedVideoDeviceId(cameraTrackRef.current?.getSettings().deviceId || "");
      setLocalStream(stream);
      setMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
      setCameraEnabled(stream.getVideoTracks().some((track) => track.enabled));
      setMediaError(null);

      peers.current.forEach((peer) => {
        stream.getTracks().forEach((track) => {
          const sender = peer.getSenders().find((item) => item.track?.kind === track.kind);
          if (sender) void sender.replaceTrack(track);
          else peer.addTrack(track, stream);
        });
      });
      return true;
    } catch (error) {
      let message = "PyMeet could not start your camera and microphone. Check device permissions and try again.";
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "SecurityError") message = "Camera and microphone access is blocked. Allow both permissions for this site, then try again.";
        if (error.name === "NotFoundError") message = "No camera or microphone was found on this device.";
        if (error.name === "NotReadableError") message = "Camera or microphone is already in use by another application.";
      }
      setMediaError(message);
      setCameraEnabled(false);
      setMicEnabled(false);
      return false;
    }
  }, []);

  const updateParticipants = useCallback((next: RoomParticipant[]) => {
    participantsRef.current = next;
    setParticipants(next);
    setRemoteStreams((streams) => streams.map((item) => ({ ...item, participant: next.find((p) => p.sid === item.sid) })));
  }, []);

  const createPeer = useCallback((targetSid: string) => {
    if (!socket) throw new Error("Socket is not connected");
    const existing = peers.current.get(targetSid);
    if (existing) return existing;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current as MediaStream));
    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit("ice-candidate", { to: targetSid, candidate: event.candidate });
    };
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];
      setRemoteStreams((current) => {
        const existingStream = current.find((item) => item.sid === targetSid);
        if (existingStream) {
          if (incomingStream) return current.map((item) => item.sid === targetSid ? { ...item, stream: incomingStream } : item);
          if (!existingStream.stream.getTracks().some((track) => track.id === event.track.id)) existingStream.stream.addTrack(event.track);
          return [...current];
        }
        const stream = incomingStream || new MediaStream([event.track]);
        return [...current, { sid: targetSid, stream, participant: participantsRef.current.find((p) => p.sid === targetSid) }];
      });
    };
    const restartIce = async () => {
      if (!shouldInitiate(socket.id, targetSid) || pc.signalingState !== "stable") return;
      const attempts = restartAttempts.current.get(targetSid) || 0;
      if (attempts >= 3) return;
      restartAttempts.current.set(targetSid, attempts + 1);
      try {
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        socket.emit("offer", { to: targetSid, offer });
      } catch (error) {
        console.warn("ICE restart failed", error);
      }
    };
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "connected" || state === "completed") {
        const timer = disconnectTimers.current.get(targetSid);
        if (timer) window.clearTimeout(timer);
        disconnectTimers.current.delete(targetSid);
        restartAttempts.current.delete(targetSid);
      } else if (state === "disconnected") {
        const previous = disconnectTimers.current.get(targetSid);
        if (previous) window.clearTimeout(previous);
        disconnectTimers.current.set(targetSid, window.setTimeout(() => {
          if (pc.iceConnectionState === "disconnected") void restartIce();
        }, 4000));
      } else if (state === "failed") {
        void restartIce();
      } else if (state === "closed") {
        setRemoteStreams((current) => current.filter((item) => item.sid !== targetSid));
      }
    };
    peers.current.set(targetSid, pc);
    return pc;
  }, [socket]);

  const callPeer = useCallback(async (targetSid: string) => {
    if (!socket || targetSid === socket.id || !shouldInitiate(socket.id, targetSid)) return;
    const pc = createPeer(targetSid);
    if (pc.signalingState !== "stable") return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { to: targetSid, offer });
  }, [createPeer, socket]);

  useEffect(() => {
    if (!enabled || !socket) return;
    let cancelled = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Media devices not supported (likely due to insecure HTTP context). Joining without media.");
      setCameraEnabled(false);
      setMicEnabled(false);
      socket.emit("join-room", { meetingId });
      return;
    }

    requestMedia().finally(() => {
      if (!cancelled) socket.emit("join-room", { meetingId });
    });

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      disconnectTimers.current.forEach((timer) => window.clearTimeout(timer));
      disconnectTimers.current.clear();
      restartAttempts.current.clear();
      iceCandidateQueues.current.clear();
      peers.current.forEach((peer) => peer.close());
      peers.current.clear();
      setRemoteStreams([]);
    };
  }, [enabled, meetingId, requestMedia, socket]);

  useEffect(() => {
    if (!socket) return;
    const onRoomJoined = async ({ participants: joined }: { participants: RoomParticipant[] }) => {
      updateParticipants(joined);
      const others = joined.filter((p) => p.sid !== socket.id);
      for (const participant of others) await callPeer(participant.sid);
    };
    const onParticipantList = ({ participants: next }: { participants: RoomParticipant[] }) => updateParticipants(next);
    const onUserJoined = ({ user }: { user: RoomParticipant }) => { if (shouldInitiate(socket.id, user.sid)) void callPeer(user.sid); };
    const onOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      const pc = createPeer(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const queuedOffer = iceCandidateQueues.current.get(from) || [];
      for (const c of queuedOffer) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      iceCandidateQueues.current.delete(from);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    };
    const onAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peers.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        const queuedAnswer = iceCandidateQueues.current.get(from) || [];
        for (const c of queuedAnswer) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        iceCandidateQueues.current.delete(from);
      }
    };
    const onIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      if (!candidate) return;
      const pc = peers.current.get(from);
      if (pc?.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.warn("Could not add ICE candidate", error);
        }
      } else {
        const queue = iceCandidateQueues.current.get(from) || [];
        queue.push(candidate);
        iceCandidateQueues.current.set(from, queue);
      }
    };
    const onLeft = ({ sid }: { sid: string }) => {
      const timer = disconnectTimers.current.get(sid);
      if (timer) window.clearTimeout(timer);
      disconnectTimers.current.delete(sid);
      restartAttempts.current.delete(sid);
      iceCandidateQueues.current.delete(sid);
      peers.current.get(sid)?.close();
      peers.current.delete(sid);
      setRemoteStreams((current) => current.filter((item) => item.sid !== sid));
      updateParticipants(participantsRef.current.filter((p) => p.sid !== sid));
    };
    socket.on("room-joined", onRoomJoined);
    socket.on("participant-list", onParticipantList);
    socket.on("user-joined", onUserJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("user-left", onLeft);
    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("participant-list", onParticipantList);
      socket.off("user-joined", onUserJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("user-left", onLeft);
    };
  }, [callPeer, createPeer, socket, updateParticipants]);

  const selectVideoDevice = useCallback(async (deviceId: string) => {
    if (!deviceId || screenSharing) return;
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const nextTrack = cameraStream.getVideoTracks()[0];
      const previousTrack = cameraTrackRef.current;
      const audioTracks = localStreamRef.current?.getAudioTracks() || [];
      const nextStream = new MediaStream([nextTrack, ...audioTracks]);

      peers.current.forEach((peer) => {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) void sender.replaceTrack(nextTrack);
        else peer.addTrack(nextTrack, nextStream);
      });

      cameraTrackRef.current = nextTrack;
      localStreamRef.current = nextStream;
      setLocalStream(nextStream);
      setSelectedVideoDeviceId(deviceId);
      setCameraEnabled(true);
      setMediaError(null);
      window.localStorage.setItem(CAMERA_STORAGE_KEY, deviceId);
      if (previousTrack && previousTrack !== nextTrack) previousTrack.stop();
    } catch {
      setMediaError("The selected camera could not be opened. Close other camera apps and try again.");
    }
  }, [screenSharing]);
  const toggleMic = () => {
    if (!localStreamRef.current) { void requestMedia(); return; }
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !track.enabled; setMicEnabled(track.enabled); });
  };

  const toggleCamera = async () => {
  if (!localStreamRef.current) { await requestMedia(); return; }

  const track = localStreamRef.current.getVideoTracks()[0];

  if (!track) return;

  // Turn OFF
  if (track.enabled) {
    track.enabled = false;
    setCameraEnabled(false);
    return;
  }

  // Turn ON
  track.enabled = true;

  peers.current.forEach((peer) => {
    const sender = peer
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender) {
      sender.replaceTrack(track);
    }
  });

  setCameraEnabled(true);
};

  const shareScreen = async () => {
  if (!localStreamRef.current) return;

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing is not supported in this browser (or insecure context).");
      return;
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const screenTrack = displayStream.getVideoTracks()[0];

    const cameraTrack = cameraTrackRef.current || localStreamRef.current.getVideoTracks()[0];

    // Replace video track for every peer
    peers.current.forEach((peer) => {
      const sender = peer
        .getSenders()
        .find((s) => s.track?.kind === "video");

      sender?.replaceTrack(screenTrack);
    });

    // Update local preview
    const screenStreamWithAudio = new MediaStream([
     screenTrack,
      ...localStreamRef.current!.getAudioTracks(),
    ]);

    localStreamRef.current = screenStreamWithAudio;
    setLocalStream(screenStreamWithAudio);

    setScreenSharing(true);

    screenTrack.onended = () => {
      const originalCameraTrack = cameraTrackRef.current || cameraTrack;
      if (!originalCameraTrack || originalCameraTrack.readyState !== "live") {
        setScreenSharing(false);
        void requestMedia();
        return;
      }

      peers.current.forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === "video");
        void sender?.replaceTrack(originalCameraTrack);
      });

      const restoredStream = new MediaStream([
        originalCameraTrack,
        ...localStreamRef.current!.getAudioTracks(),
      ]);
      localStreamRef.current = restoredStream;
      setLocalStream(restoredStream);
      setScreenSharing(false);
    };

  } catch (err) {
    console.error(err);
  }
};

  const leave = useCallback((endForEveryone = false) => {
    socket?.emit(endForEveryone ? "end-meeting" : "user-left", { meetingId });
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraTrackRef.current?.stop();
    cameraTrackRef.current = null;
    peers.current.forEach((peer) => peer.close());
    peers.current.clear();
    setLocalStream(null);
    setRemoteStreams([]);
  }, [meetingId, socket]);

  return { localStream, remoteStreams, participants, micEnabled, cameraEnabled, screenSharing, mediaError, videoDevices, selectedVideoDeviceId, requestMedia, selectVideoDevice, toggleMic, toggleCamera, shareScreen, leave };
}









