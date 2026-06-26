import { MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, UserPlus, Users, Video, VideoOff } from "lucide-react";
import { Button } from "./Button";
import { ReactionPicker } from "./ReactionPicker";

const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const supportsScreenShare = typeof navigator !== "undefined" && navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia && !isMobile;

export function MeetingControls({ isHost, micEnabled, cameraEnabled, screenSharing, onToggleMic, onToggleCamera, onShareScreen, onToggleChat, onToggleParticipants, onInvite, onLeave, onSendReaction }: { isHost: boolean; micEnabled: boolean; cameraEnabled: boolean; screenSharing: boolean; onToggleMic: () => void; onToggleCamera: () => void; onShareScreen: () => void; onToggleChat: () => void; onToggleParticipants: () => void; onInvite: () => void; onLeave: () => void; onSendReaction: (emoji: string) => void }) {
  const item = "h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg px-0";
  return (
    <div className="fixed bottom-3 sm:bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-wrap justify-center items-center gap-1.5 sm:gap-2 rounded-lg border border-line bg-slate-950/80 p-2 shadow-soft backdrop-blur-xl w-max max-w-[calc(100vw-1rem)]">
      <Button title={micEnabled ? "Mute microphone" : "Unmute microphone"} variant={micEnabled ? "secondary" : "danger"} className={item} onClick={onToggleMic}>{micEnabled ? <Mic size={18} className="sm:w-[19px] sm:h-[19px]" /> : <MicOff size={18} className="sm:w-[19px] sm:h-[19px]" />}</Button>
      <Button title={cameraEnabled ? "Turn camera off" : "Turn camera on"} variant={cameraEnabled ? "secondary" : "danger"} className={item} onClick={onToggleCamera}>{cameraEnabled ? <Video size={18} className="sm:w-[19px] sm:h-[19px]" /> : <VideoOff size={18} className="sm:w-[19px] sm:h-[19px]" />}</Button>
      {supportsScreenShare && (
        <Button title={isHost ? "Share screen" : "Share screen"} variant={screenSharing ? "primary" : "secondary"} className={item} onClick={onShareScreen}><MonitorUp size={18} className="sm:w-[19px] sm:h-[19px]" /></Button>
      )}
      <ReactionPicker onSelectReaction={onSendReaction} />
      <Button title="Invite People" variant="secondary" className={item} onClick={onInvite}><UserPlus size={18} className="sm:w-[19px] sm:h-[19px]" /></Button>
      <Button title="Chat" variant="secondary" className={item} onClick={onToggleChat}><MessageSquare size={18} className="sm:w-[19px] sm:h-[19px]" /></Button>
      <Button title="Participants" variant="secondary" className={item} onClick={onToggleParticipants}><Users size={18} className="sm:w-[19px] sm:h-[19px]" /></Button>
      <Button title={isHost ? "End meeting for everyone" : "Leave meeting"} variant="danger" className="h-10 sm:h-11 shrink-0 rounded-lg px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap" onClick={onLeave}><PhoneOff size={18} className="sm:w-[19px] sm:h-[19px]" /> {isHost ? "End" : "Leave"}</Button>
    </div>
  );
}
