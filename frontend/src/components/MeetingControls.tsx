import { MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, UserPlus, Users, Video, VideoOff } from "lucide-react";
import { Button } from "./Button";
import { ReactionPicker } from "./ReactionPicker";

export function MeetingControls({ isHost, micEnabled, cameraEnabled, screenSharing, onToggleMic, onToggleCamera, onShareScreen, onToggleChat, onToggleParticipants, onInvite, onLeave, onSendReaction }: { isHost: boolean; micEnabled: boolean; cameraEnabled: boolean; screenSharing: boolean; onToggleMic: () => void; onToggleCamera: () => void; onShareScreen: () => void; onToggleChat: () => void; onToggleParticipants: () => void; onInvite: () => void; onLeave: () => void; onSendReaction: (emoji: string) => void }) {
  const item = "h-11 w-11 rounded-lg px-0";
  return (
    <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-line bg-slate-950/80 p-2 shadow-soft backdrop-blur-xl">
      <Button title={micEnabled ? "Mute microphone" : "Unmute microphone"} variant={micEnabled ? "secondary" : "danger"} className={item} onClick={onToggleMic}>{micEnabled ? <Mic size={19} /> : <MicOff size={19} />}</Button>
      <Button title={cameraEnabled ? "Turn camera off" : "Turn camera on"} variant={cameraEnabled ? "secondary" : "danger"} className={item} onClick={onToggleCamera}>{cameraEnabled ? <Video size={19} /> : <VideoOff size={19} />}</Button>
      <Button title={isHost ? "Share screen" : "Share screen"} variant={screenSharing ? "primary" : "secondary"} className={item} onClick={onShareScreen}><MonitorUp size={19} /></Button>
      <ReactionPicker onSelectReaction={onSendReaction} />
      <Button title="Invite People" variant="secondary" className={item} onClick={onInvite}><UserPlus size={19} /></Button>
      <Button title="Chat" variant="secondary" className={item} onClick={onToggleChat}><MessageSquare size={19} /></Button>
      <Button title="Participants" variant="secondary" className={item} onClick={onToggleParticipants}><Users size={19} /></Button>
      <Button title={isHost ? "End meeting for everyone" : "Leave meeting"} variant="danger" className="h-11 rounded-lg px-4" onClick={onLeave}><PhoneOff size={19} /> {isHost ? "End" : "Leave"}</Button>
    </div>
  );
}
