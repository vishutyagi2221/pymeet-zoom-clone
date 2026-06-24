import { Check, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

interface InviteModalProps {
  open: boolean;
  meetingId: string;
  meetingTitle: string;
  onClose: () => void;
}

export function InviteModal({ open, meetingId, meetingTitle, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/join/${meetingId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Join my PyMeet video meeting!\n\nMeeting Name: ${meetingTitle}\n\nClick here to join:\n${inviteLink}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <Modal open={open} title="Invite People" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-slate-300">
          Share this link with others so they can join the meeting.
        </p>
        
        <div className="flex items-center gap-2 rounded-lg border border-line bg-slate-900 p-2">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="w-full bg-transparent px-2 text-sm text-white outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-2 rounded-md bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#128C7E]"
        >
          <MessageCircle size={18} />
          Share on WhatsApp
        </a>
      </div>
    </Modal>
  );
}
