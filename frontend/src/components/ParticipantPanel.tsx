import { AnimatePresence, motion } from "framer-motion";
import { Crown, UserCheck, UserMinus, X } from "lucide-react";
import type { Socket } from "socket.io-client";
import type { RoomParticipant } from "../types";

export function ParticipantPanel({ open, participants, waitingParticipants = [], socket, meetingId, currentSid, onClose }: { open: boolean; participants: RoomParticipant[]; waitingParticipants?: RoomParticipant[]; socket: Socket | null; meetingId: string; currentSid?: string; onClose: () => void }) {
  const self = participants.find((p) => p.sid === currentSid);
  const canManage = Boolean(self?.is_host);
  return (
    <AnimatePresence>
      {open && <motion.aside initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }} className="fixed right-0 top-0 z-40 h-full w-full max-w-sm overflow-y-auto border-l border-line bg-slate-950/90 p-4 text-white shadow-soft backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Participants ({participants.length})</h2><button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close participants"><X size={18} /></button></div>
        {canManage && waitingParticipants.length > 0 && <div className="mb-5"><h3 className="mb-2 text-sm font-semibold text-cyan-300">Waiting room</h3><div className="space-y-2">{waitingParticipants.map((participant) => <motion.div layout key={participant.sid} className="flex items-center gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3"><div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold" style={{ background: participant.avatar_color }}>{participant.name[0]}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{participant.name}</div><div className="text-xs text-slate-400">Waiting for admission</div></div><button onClick={() => socket?.emit("admit-participant", { meetingId, sid: participant.sid })} className="rounded-lg p-2 text-cyan-100 hover:bg-cyan-300/15" title="Admit participant"><UserCheck size={17} /></button></motion.div>)}</div></div>}
        <div className="space-y-2">
          {participants.map((participant) => <motion.div layout key={participant.sid} className="flex items-center gap-3 rounded-lg border border-line bg-white/5 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold" style={{ background: participant.avatar_color }}>{participant.name[0]}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{participant.name} {participant.sid === currentSid && "(You)"}</div><div className="flex items-center gap-1 text-xs text-slate-400">{participant.is_host && <><Crown size={13} className="text-amber-300" /> Host</>}</div></div>
            {canManage && participant.sid !== currentSid && <button onClick={() => socket?.emit("remove-participant", { meetingId, sid: participant.sid })} className="rounded-lg p-2 text-rose-200 hover:bg-rose-500/15" title="Remove participant"><UserMinus size={17} /></button>}
          </motion.div>)}
        </div>
      </motion.aside>}
    </AnimatePresence>
  );
}
