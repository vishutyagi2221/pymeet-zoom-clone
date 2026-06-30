import { MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, SmilePlus, Users, Video, VideoOff } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";

const reactions = ["\u{1F44D}", "\u{1F44F}", "\u{1F389}", "\u2764\uFE0F", "\u{1F602}", "\u{1F525}"];

export function MeetingControls({
  isHost,
  micEnabled,
  cameraEnabled,
  screenSharing,
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onSendReaction,
  onToggleChat,
  onToggleParticipants,
  onLeave,
}: {
  isHost: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  screenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onShareScreen: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const item = "h-11 w-11 shrink-0 rounded-lg px-0";

  const sendReaction = (emoji: string) => {
    onSendReaction(emoji);
    setReactionsOpen(false);
  };

  return (
    <div className="fixed bottom-5 left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 overflow-visible rounded-lg border border-line bg-slate-950/80 p-2 shadow-soft backdrop-blur-xl">
      <Button title={micEnabled ? "Mute microphone" : "Unmute microphone"} variant={micEnabled ? "secondary" : "danger"} className={item} onClick={onToggleMic}>{micEnabled ? <Mic size={19} /> : <MicOff size={19} />}</Button>
      <Button title={cameraEnabled ? "Turn camera off" : "Turn camera on"} variant={cameraEnabled ? "secondary" : "danger"} className={item} onClick={onToggleCamera}>{cameraEnabled ? <Video size={19} /> : <VideoOff size={19} />}</Button>
      <Button title={screenSharing ? "Stop sharing screen" : "Share screen"} variant={screenSharing ? "primary" : "secondary"} className={item} onClick={onShareScreen}><MonitorUp size={19} /></Button>
      <div className="relative shrink-0">
        <Button title="Send reaction" variant={reactionsOpen ? "primary" : "secondary"} className={item} onClick={() => setReactionsOpen((open) => !open)}><SmilePlus size={19} /></Button>
        {reactionsOpen && (
          <div className="absolute bottom-14 left-1/2 z-50 grid -translate-x-1/2 grid-cols-3 gap-1 rounded-lg border border-line bg-slate-950/95 p-2 shadow-soft backdrop-blur-xl">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => sendReaction(emoji)}
                className="grid h-10 w-10 place-items-center rounded-lg text-xl hover:bg-white/10"
                aria-label={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button title="Chat" variant="secondary" className={item} onClick={onToggleChat}><MessageSquare size={19} /></Button>
      <Button title="Participants" variant="secondary" className={item} onClick={onToggleParticipants}><Users size={19} /></Button>
      <Button title={isHost ? "End meeting for everyone" : "Leave meeting"} variant="danger" className="h-11 shrink-0 rounded-lg px-4" onClick={onLeave}><PhoneOff size={19} /> {isHost ? "End" : "Leave"}</Button>
    </div>
  );
}
