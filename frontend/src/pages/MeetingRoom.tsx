import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Copy, Settings2, Shield } from "lucide-react";
import { ChatPanel } from "../components/ChatPanel";
import { MeetingAssistant } from "../components/MeetingAssistant";
import { MeetingControls } from "../components/MeetingControls";
import { MeetingExitScreen } from "../components/MeetingExitScreen";
import { Modal } from "../components/Modal";
import { ParticipantPanel } from "../components/ParticipantPanel";
import { VideoGrid } from "../components/VideoGrid";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import { meetingApi } from "../services/api";
import type { Meeting, RoomParticipant } from "../types";

export function MeetingRoom() {
  const { meetingId = "" } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const socket = useSocket(token);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [cameraSettingsOpen, setCameraSettingsOpen] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<RoomParticipant[]>([]);
  const [exitMessage, setExitMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const { localStream, remoteStreams, participants, micEnabled, cameraEnabled, screenSharing, mediaError, videoDevices, selectedVideoDeviceId, requestMedia, selectVideoDevice, toggleMic, toggleCamera, shareScreen, leave } = useWebRTC(socket, meetingId, Boolean(meeting?.is_active && !exitMessage));

  useEffect(() => {
    meetingApi.get(meetingId).then(({ data }) => {
      setMeeting(data);
      if (!data.is_active) setExitMessage("This meeting has already ended. Thanks for stopping by.");
    }).catch(() => navigate("/"));
  }, [meetingId, navigate]);
  useEffect(() => {
    if (!socket) return;
    const onWaiting = () => setWaiting(true);
    const onJoined = () => setWaiting(false);
    const onRemoved = () => navigate("/");
    const onMeetingEnded = () => {
      leave(false);
      setWaiting(false);
      setExitMessage((current) => current || "The host ended the meeting. We hope the conversation was time well spent.");
    };
    const onWaitingList = ({ participants: next }: { participants: RoomParticipant[] }) => setWaitingParticipants(next);
    socket.on("waiting-room", onWaiting);
    socket.on("room-joined", onJoined);
    socket.on("removed-from-room", onRemoved);
    socket.on("meeting-ended", onMeetingEnded);
    socket.on("waiting-list", onWaitingList);
    const timer = window.setInterval(() => socket.emit("waiting-list", { meetingId }), 2000);
    return () => { window.clearInterval(timer); socket.off("waiting-room", onWaiting); socket.off("room-joined", onJoined); socket.off("removed-from-room", onRemoved); socket.off("meeting-ended", onMeetingEnded); socket.off("waiting-list", onWaitingList); };
  }, [leave, meetingId, navigate, socket]);

  const localParticipant = useMemo<RoomParticipant | undefined>(() => participants.find((p) => p.id === user?.id) || (user ? { sid: socket?.id || "local", id: user.id, name: user.name, email: user.email, avatar_color: user.avatar_color, is_host: meeting?.host.id === user.id } : undefined), [meeting?.host.id, participants, socket?.id, user]);
  const exit = () => {
    const isHost = localParticipant?.is_host ?? false;
    if (isHost && !window.confirm("End this meeting for everyone?")) return;
    leave(isHost);
    setExitMessage(isHost
      ? "You ended the meeting for everyone. Thanks for bringing people together."
      : "You left the meeting and your camera and microphone are now disconnected."
    );
  };
  const sendReaction = (emoji: string) => {
    socket?.emit("reaction", { emoji, sentAt: new Date().toISOString() });
  };
  const copyMeetingId = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(meetingId);
      } else {
        const input = document.createElement("input");
        input.value = meetingId;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (exitMessage) return (
    <MeetingExitScreen
      meetingTitle={meeting?.title || "PyMeet Meeting"}
      meetingId={meetingId}
      message={exitMessage}
      onDashboard={() => navigate("/")}
      onJoinAnother={() => navigate("/join")}
    />
  );

  if (waiting) return <div className="bg-premium grid min-h-screen place-items-center p-6 text-center text-white"><div><Shield className="mx-auto mb-4 text-cyan-300" size={42} /><h1 className="text-3xl font-bold">You are in the waiting room</h1><p className="mt-3 text-slate-300">The host will admit you shortly.</p></div></div>;

  return (
    <main className="min-h-screen overflow-hidden bg-[#050914] text-white">
      <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-line bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
        <div><h1 className="font-semibold">{meeting?.title || "PyMeet Meeting"}</h1><p className="text-xs text-slate-400">{meetingId}</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCameraSettingsOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white/5 text-slate-200 hover:bg-white/10" title="Choose camera" aria-label="Choose camera"><Settings2 size={17} /></button>
          <button onClick={() => void copyMeetingId()} className="flex items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"><Copy size={16} /> {copied ? "Copied" : "Copy ID"}</button>
        </div>
      </header>
      <section className="fixed inset-0 flex h-full w-full items-center justify-center p-4"><VideoGrid localStream={localStream} localUser={localParticipant} remoteStreams={remoteStreams} cameraEnabled={cameraEnabled} screenSharing={screenSharing} /></section>
      {mediaError && (
        <div className="fixed left-1/2 top-24 z-30 flex w-[min(92vw,620px)] -translate-x-1/2 items-center gap-3 rounded-lg border border-amber-400/40 bg-slate-950/95 p-4 shadow-soft backdrop-blur-xl">
          <Camera className="shrink-0 text-amber-300" size={22} />
          <p className="min-w-0 flex-1 text-sm text-slate-200">{mediaError}</p>
          <button onClick={() => void requestMedia()} className="shrink-0 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">Try again</button>
        </div>
      )}
      <MeetingAssistant socket={socket} participants={participants} waitingParticipants={waitingParticipants} isHost={localParticipant?.is_host ?? false} screenSharing={screenSharing} />
      <MeetingControls isHost={localParticipant?.is_host ?? false} micEnabled={micEnabled} cameraEnabled={cameraEnabled} screenSharing={screenSharing} onToggleMic={toggleMic} onToggleCamera={toggleCamera} onShareScreen={shareScreen} onSendReaction={sendReaction} onToggleChat={() => setChatOpen((v) => !v)} onToggleParticipants={() => setParticipantsOpen((v) => !v)} onLeave={exit} />
      <Modal open={cameraSettingsOpen} title="Choose camera" onClose={() => setCameraSettingsOpen(false)}>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="camera-device">Camera</label>
        <select id="camera-device" value={selectedVideoDeviceId} onChange={(event) => void selectVideoDevice(event.target.value)} disabled={screenSharing} className="w-full rounded-lg border border-line bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50">
          {videoDevices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>
          ))}
        </select>
        {screenSharing && <p className="mt-3 text-sm text-amber-300">Stop screen sharing before changing the camera.</p>}
      </Modal>
      <ChatPanel open={chatOpen} socket={socket} onClose={() => setChatOpen(false)} />
      <ParticipantPanel open={participantsOpen} participants={participants} waitingParticipants={waitingParticipants} socket={socket} meetingId={meetingId} currentSid={socket?.id} onClose={() => setParticipantsOpen(false)} />
    </main>
  );
}



