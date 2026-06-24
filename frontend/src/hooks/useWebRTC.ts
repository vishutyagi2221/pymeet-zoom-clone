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
const MIC_STORAGE_KEY = "pymeet-mic-device-id";
const SPEAKER_STORAGE_KEY = "pymeet-speaker-device-id";

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
      return { 
        deviceId: { exact: physicalCamera.deviceId }, 
        width: { ideal: 3840 }, 
        height: { ideal: 2160 },
        frameRate: { ideal: 60 },
        // @ts-ignore
        resizeMode: "crop-and-scale"
      };
    }
  } catch {
    // Device labels may be hidden until the first permission grant.
  }

  return { 
    facingMode: "user", 
    width: { ideal: 3840 }, 
    height: { ideal: 2160 },
    frameRate: { ideal: 60 },
    // @ts-ignore
    resizeMode: "crop-and-scale"
  };
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
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
  const [selectedAudioInputId, setSelectedAudioInputId] = useState("");
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState("");
  const [newDeviceConnected, setNewDeviceConnected] = useState<MediaDeviceInfo | null>(null);

  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const participantsRef = useRef<RoomParticipant[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const previousDevicesRef = useRef<MediaDeviceInfo[]>([]);
  const iceCandidateQueues = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const disconnectTimers = useRef<Map<string, number>>(new Map());
  const restartAttempts = useRef<Map<string, number>>(new Map());

  const updateDeviceList = useCallback(async (isInitial = false) => {
    if (!navigator.mediaDevices?.enumerateDevices) return null;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const video = devices.filter((d) => d.kind === "videoinput");
      const audioIn = devices.filter((d) => d.kind === "audioinput");
      const audioOut = devices.filter((d) => d.kind === "audiooutput");

      setVideoDevices(video);
      setAudioInputDevices(audioIn);
      setAudioOutputDevices(audioOut);

      if (!isInitial) {
        const prevIds = new Set(previousDevicesRef.current.map((d) => d.deviceId));
        const newDevice = devices.find((d) => 
          !prevIds.has(d.deviceId) && 
          d.deviceId && 
          d.deviceId !== "default" && 
          d.deviceId !== "communications" && 
          (d.kind === "audioinput" || d.kind === "audiooutput")
        );
        if (newDevice) {
          setNewDeviceConnected(newDevice);
          setTimeout(() => setNewDeviceConnected(null), 8000);
        }
      }
      previousDevicesRef.current = devices;
      return { video, audioIn, audioOut };
    } catch { return null; }
  }, []);

  useEffect(() => {
    const handler = () => void updateDeviceList();
    navigator.mediaDevices?.addEventListener("devicechange", handler);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", handler);
  }, [updateDeviceList]);

  const requestMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("Camera and microphone require a secure HTTPS connection.");
      setCameraEnabled(false);
      setMicEnabled(false);
      return false;
    }

    try {
      const video = await preferredCameraConstraints();
      const savedMicId = window.localStorage.getItem(MIC_STORAGE_KEY);
      
      const baseAudioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      };
      
      const audioConstraints = savedMicId 
        ? { ...baseAudioConstraints, deviceId: { exact: savedMicId } } 
        : baseAudioConstraints;
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: audioConstraints });
      } catch {
        // Fallback if strict constraints fail
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: baseAudioConstraints 
        });
      }

      const deviceLists = await updateDeviceList(true);
      const availableCameras = deviceLists?.video || [];

      const currentTrack = stream.getVideoTracks()[0];
      const physicalCamera = availableCameras.find((device) =>
        PHYSICAL_CAMERA_PATTERN.test(device.label) && !VIRTUAL_CAMERA_PATTERN.test(device.label)
      );
      if (currentTrack && physicalCamera && VIRTUAL_CAMERA_PATTERN.test(currentTrack.label) && physicalCamera.deviceId !== currentTrack.getSettings().deviceId) {
        try {
          const physicalStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              deviceId: { exact: physicalCamera.deviceId }, 
              width: { ideal: 3840 }, 
              height: { ideal: 2160 },
              frameRate: { ideal: 60 },
              // @ts-ignore
              resizeMode: "crop-and-scale"
            },
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
      audioTrackRef.current = stream.getAudioTracks()[0] || null;
      
      setSelectedVideoDeviceId(cameraTrackRef.current?.getSettings().deviceId || "");
      setSelectedAudioInputId(audioTrackRef.current?.getSettings().deviceId || savedMicId || "");
      setSelectedAudioOutputId(window.localStorage.getItem(SPEAKER_STORAGE_KEY) || "");
      
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
      
      // Broadcast our actual initial media state to everyone in the room
      const currentCameraState = cameraTrackRef.current ? cameraTrackRef.current.enabled && cameraTrackRef.current.readyState === "live" : false;
      const currentMicState = audioTrackRef.current ? audioTrackRef.current.enabled : false;
      socket.emit("media-state", { cameraEnabled: currentCameraState, micEnabled: currentMicState });

      const others = joined.filter((p) => p.sid !== socket.id);
      for (const participant of others) await callPeer(participant.sid);
    };
    const onParticipantList = ({ participants: next }: { participants: RoomParticipant[] }) => {
      // Preserve existing media states when updating the participant list
      const merged = next.map(p => {
        const existing = participantsRef.current.find(ep => ep.sid === p.sid);
        if (existing) {
          return {
            ...p,
            ...(existing.cameraEnabled !== undefined ? { cameraEnabled: existing.cameraEnabled } : {}),
            ...(existing.micEnabled !== undefined ? { micEnabled: existing.micEnabled } : {})
          };
        }
        return p;
      });
      updateParticipants(merged);
    };
    const onUserJoined = ({ user }: { user: RoomParticipant }) => { 
      // Inform the new user of our current media state
      const currentCameraState = cameraTrackRef.current ? cameraTrackRef.current.enabled && cameraTrackRef.current.readyState === "live" : false;
      const currentMicState = audioTrackRef.current ? audioTrackRef.current.enabled : false;
      socket.emit("media-state", { cameraEnabled: currentCameraState, micEnabled: currentMicState });
      
      if (shouldInitiate(socket.id, user.sid)) void callPeer(user.sid); 
    };
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
    const onMediaState = ({ sid, cameraEnabled, micEnabled }: { sid: string; cameraEnabled?: boolean; micEnabled?: boolean }) => {
      updateParticipants(participantsRef.current.map((p) => {
        if (p.sid === sid) {
          return {
            ...p,
            ...(cameraEnabled !== undefined ? { cameraEnabled } : {}),
            ...(micEnabled !== undefined ? { micEnabled } : {}),
          };
        }
        return p;
      }));
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
    socket.on("media-state", onMediaState);
    socket.on("user-left", onLeft);
    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("participant-list", onParticipantList);
      socket.off("user-joined", onUserJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("media-state", onMediaState);
      socket.off("user-left", onLeft);
    };
  }, [callPeer, createPeer, socket, updateParticipants]);

  const selectVideoDevice = useCallback(async (deviceId: string) => {
    if (!deviceId || screenSharing) return;
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: { exact: deviceId }, 
          width: { ideal: 3840 }, 
          height: { ideal: 2160 },
          frameRate: { ideal: 60 },
          // @ts-ignore
          resizeMode: "crop-and-scale"
        },
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

  const selectAudioInputDevice = useCallback(async (deviceId: string) => {
    if (!deviceId) return;
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      });
      const nextTrack = micStream.getAudioTracks()[0];
      const previousTrack = audioTrackRef.current;

      if (nextTrack) {
        peers.current.forEach((peer) => {
          const sender = peer.getSenders().find((item) => item.track?.kind === "audio");
          if (sender) void sender.replaceTrack(nextTrack);
        });

        if (localStreamRef.current) {
          if (previousTrack) localStreamRef.current.removeTrack(previousTrack);
          localStreamRef.current.addTrack(nextTrack);
        }

        audioTrackRef.current = nextTrack;
        setSelectedAudioInputId(deviceId);
        window.localStorage.setItem(MIC_STORAGE_KEY, deviceId);
        
        // Match the mute state
        nextTrack.enabled = micEnabled;

        if (previousTrack && previousTrack !== nextTrack) previousTrack.stop();
      }
    } catch {
      setMediaError("Could not connect to the selected microphone.");
    }
  }, [micEnabled]);

  const selectAudioOutputDevice = useCallback((deviceId: string) => {
    setSelectedAudioOutputId(deviceId);
    window.localStorage.setItem(SPEAKER_STORAGE_KEY, deviceId);
  }, []);

  const clearNewDeviceToast = useCallback(() => setNewDeviceConnected(null), []);

  const toggleMic = () => {
    if (!localStreamRef.current) { void requestMedia(); return; }
    localStreamRef.current?.getAudioTracks().forEach((track) => { 
      track.enabled = !track.enabled; 
      setMicEnabled(track.enabled); 
      socket?.emit("media-state", { micEnabled: track.enabled });
    });
  };

  const toggleCamera = async () => {
    if (!localStreamRef.current) { void requestMedia(); return; }

    const currentTrack = localStreamRef.current.getVideoTracks()[0];

    if (cameraEnabled) {
      if (currentTrack) currentTrack.stop();
      setCameraEnabled(false);
      socket?.emit("media-state", { cameraEnabled: false });
      return;
    }

    try {
      const videoConstraints = await preferredCameraConstraints();
      const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return;

      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextStream = new MediaStream([newTrack, ...audioTracks]);

      localStreamRef.current = nextStream;
      cameraTrackRef.current = newTrack;
      setLocalStream(nextStream);
      setCameraEnabled(true);
      setMediaError(null);
      socket?.emit("media-state", { cameraEnabled: true });

      peers.current.forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === "video");
        if (sender) void sender.replaceTrack(newTrack);
        else peer.addTrack(newTrack, nextStream);
      });
    } catch {
      setMediaError("Could not restart camera. Check permissions.");
    }
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

  return { 
    localStream, remoteStreams, participants, micEnabled, cameraEnabled, screenSharing, mediaError, 
    videoDevices, audioInputDevices, audioOutputDevices, 
    selectedVideoDeviceId, selectedAudioInputId, selectedAudioOutputId, newDeviceConnected,
    requestMedia, selectVideoDevice, selectAudioInputDevice, selectAudioOutputDevice, clearNewDeviceToast,
    toggleMic, toggleCamera, shareScreen, leave 
  };
}









