import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import type { Socket } from "socket.io-client";
import type { ChatMessage } from "../types";

export function ChatPanel({ open, socket, onClose }: { open: boolean; socket: Socket | null; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
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
    socket.emit("chat-message", { message, sentAt });
    setDraft("");
  };
  return (
    <AnimatePresence>
      {open && <motion.aside initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }} className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-line bg-slate-950/90 p-4 text-white shadow-soft backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Meeting chat</h2><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close chat"><X size={18} /></button></div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((msg) => <div key={msg.id} className="flex gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: msg.user.avatar_color }}>{(msg.user.name || "G")[0]}</div><div><div className="mb-1 flex items-baseline gap-2"><span className="text-sm font-medium">{msg.user.name}</span><span className="text-[11px] text-slate-400">{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><p className="rounded-lg bg-white/10 px-3 py-2 text-sm text-slate-100">{msg.message}</p></div></div>)}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={submit} className="mt-4 flex gap-2"><input value={draft} onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-300" placeholder="Message everyone" /><button type="submit" className="rounded-lg bg-cyan-400 px-3 text-slate-950" aria-label="Send"><Send size={18} /></button></form>
      </motion.aside>}
    </AnimatePresence>
  );
}
