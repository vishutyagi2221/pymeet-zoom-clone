import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import type { Socket } from "socket.io-client";
import type { ChatMessage, RoomParticipant } from "../types";

export function ChatPanel({ open, socket, localUser, participants, onClose }: { open: boolean; socket: Socket | null; localUser?: Partial<RoomParticipant>; participants: RoomParticipant[]; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [targetSid, setTargetSid] = useState<string>("everyone");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!socket) return;
    const onMessage = (message: Omit<ChatMessage, "id">) => setMessages((current) => [...current, { ...message, id: crypto.randomUUID() }]);
    socket.on("chat-message", onMessage);
    return () => { socket.off("chat-message", onMessage); };
  }, [socket]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !socket) return;
    const sentAt = new Date().toISOString();
    const message = draft.trim();
    
    if (targetSid === "everyone") {
      socket.emit("chat-message", { message, sentAt });
      // Add own message locally since server skips sender
      if (localUser) {
        setMessages((current) => [...current, {
          id: crypto.randomUUID(),
          message,
          user: localUser as RoomParticipant,
          sentAt,
        }]);
      }
    } else {
      socket.emit("chat-message", { message, sentAt, target: targetSid });
      const targetUser = participants.find(p => p.sid === targetSid);
      if (localUser) {
        setMessages((current) => [...current, {
          id: crypto.randomUUID(),
          message,
          user: localUser as RoomParticipant,
          sentAt,
          isPrivate: true,
          targetUser,
        }]);
      }
    }
    
    setDraft("");
  };
  return (
    <AnimatePresence>
      {open && <motion.aside initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }} className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-line bg-slate-950/90 p-4 text-white shadow-soft backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Meeting chat</h2><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close chat"><X size={18} /></button></div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: msg.user.avatar_color }}>{(msg.user.name || "G")[0]}</div>
              <div>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-sm font-medium">{msg.user.name}</span>
                  {msg.isPrivate && (
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                      {msg.targetUser ? `Direct Message to ${msg.targetUser.name}` : "Direct Message"}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className={`rounded-lg px-3 py-2 text-sm text-slate-100 ${msg.isPrivate ? "bg-purple-500/20 border border-purple-500/30" : "bg-white/10"}`}>{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
          <select 
            value={targetSid} 
            onChange={(e) => setTargetSid(e.target.value)}
            className="w-full rounded-lg border border-line bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option value="everyone" className="bg-slate-900">Everyone</option>
            {participants.filter(p => p.sid !== localUser?.sid).map(p => (
              <option key={p.sid} value={p.sid} className="bg-slate-900">{p.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-300" placeholder={targetSid === "everyone" ? "Message everyone" : `Message ${participants.find(p => p.sid === targetSid)?.name || "privately"}`} />
            <button type="submit" className="rounded-lg bg-cyan-400 px-3 text-slate-950" aria-label="Send"><Send size={18} /></button>
          </div>
        </form>
      </motion.aside>}
    </AnimatePresence>
  );
}
