import { AnimatePresence, motion } from "framer-motion";
import { Clock3, MessageSquare, MonitorUp, Sparkles, UserMinus, UserPlus, Wifi, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { RoomParticipant } from "../types";

type NoticeKind = "info" | "success" | "warning" | "danger";

interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  message: string;
}

const kindStyles: Record<NoticeKind, string> = {
  info: "border-cyan-400/35 bg-slate-950/95",
  success: "border-emerald-400/35 bg-slate-950/95",
  warning: "border-amber-400/35 bg-slate-950/95",
  danger: "border-rose-400/35 bg-slate-950/95",
};

const iconStyles: Record<NoticeKind, string> = {
  info: "text-cyan-300",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-rose-300",
};

export function MeetingAssistant({
  socket,
  participants,
  waitingParticipants,
  isHost,
  screenSharing,
}: {
  socket: Socket | null;
  participants: RoomParticipant[];
  waitingParticipants: RoomParticipant[];
  isHost: boolean;
  screenSharing: boolean;
}) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const participantsRef = useRef<Map<string, RoomParticipant>>(new Map());
  const waitingRef = useRef<Map<string, RoomParticipant>>(new Map());
  const initializedWaiting = useRef(false);
  const previousScreenSharing = useRef(screenSharing);

  useEffect(() => {
    participantsRef.current = new Map(participants.map((participant) => [participant.sid, participant]));
  }, [participants]);

  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback((kind: NoticeKind, title: string, message: string) => {
    const id = crypto.randomUUID();
    setNotices((current) => [...current.slice(-3), { id, kind, title, message }]);
    window.setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  useEffect(() => {
    if (!socket) return;

    const onUserJoined = ({ user }: { user: RoomParticipant }) => {
      participantsRef.current.set(user.sid, user);
      notify("success", "Participant joined", `${user.name} joined the meeting.`);
    };
    const onUserLeft = ({ sid }: { sid: string }) => {
      const participant = participantsRef.current.get(sid);
      participantsRef.current.delete(sid);
      notify("info", "Participant left", `${participant?.name || "A participant"} left the meeting.`);
    };
    const onChatMessage = ({ user }: { user: RoomParticipant }) => {
      notify("info", "New chat message", `${user.name} sent a message.`);
    };
    const onConnect = () => notify("success", "Connection restored", "You are connected to the meeting again.");
    const onDisconnect = () => notify("danger", "Connection lost", "PyMeet is trying to reconnect automatically.");
    const onConnectError = () => notify("warning", "Connection issue", "The meeting server is temporarily unavailable.");

    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("chat-message", onChatMessage);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("chat-message", onChatMessage);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [notify, socket]);

  useEffect(() => {
    if (!isHost) return;
    const next = new Map(waitingParticipants.map((participant) => [participant.sid, participant]));

    if (initializedWaiting.current) {
      next.forEach((participant, sid) => {
        if (!waitingRef.current.has(sid)) notify("warning", "Waiting room", `${participant.name} is waiting to join.`);
      });
      waitingRef.current.forEach((participant, sid) => {
        if (!next.has(sid)) notify("info", "Waiting room updated", `${participant.name} is no longer waiting.`);
      });
    } else if (waitingParticipants.length > 0) {
      waitingParticipants.forEach((participant) => notify("warning", "Waiting room", `${participant.name} is waiting to join.`));
    }

    initializedWaiting.current = true;
    waitingRef.current = next;
  }, [isHost, notify, waitingParticipants]);

  useEffect(() => {
    if (previousScreenSharing.current !== screenSharing) {
      notify("info", screenSharing ? "Screen sharing started" : "Screen sharing stopped", screenSharing ? "Everyone can now see your shared screen." : "Your camera view has been restored.");
      previousScreenSharing.current = screenSharing;
    }
  }, [notify, screenSharing]);

  return (
    <div aria-live="polite" aria-label="PyMeet Assistant notifications" className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {notices.map((notice) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, x: 28, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-soft backdrop-blur-xl ${kindStyles[notice.kind]}`}
          >
            <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 ${iconStyles[notice.kind]}`}>
              {notice.title.includes("joined") ? <UserPlus size={17} /> : notice.title.includes("left") ? <UserMinus size={17} /> : notice.title.includes("Waiting") ? <Clock3 size={17} /> : notice.title.includes("chat") ? <MessageSquare size={17} /> : notice.title.includes("Screen") ? <MonitorUp size={17} /> : notice.kind === "danger" ? <WifiOff size={17} /> : notice.title.includes("Connection") ? <Wifi size={17} /> : <Sparkles size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase text-cyan-300"><Sparkles size={12} /> PyMeet Assistant</div>
              <p className="mt-1 text-sm font-semibold text-white">{notice.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-300">{notice.message}</p>
            </div>
            <button type="button" onClick={() => dismiss(notice.id)} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Dismiss notification"><X size={15} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
