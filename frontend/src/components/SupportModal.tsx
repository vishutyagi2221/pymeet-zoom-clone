import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { CheckCircle2, Mail } from "lucide-react";

export function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [success, setSuccess] = useState(false);

  const wordCount = query.trim() ? query.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit || !query.trim()) return;
    
    // Simulate API call for sending mock email
    setTimeout(() => {
      setSuccess(true);
      setQuery("");
      
      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    }, 500);
  };

  const handleClose = () => {
    setSuccess(false);
    setQuery("");
    onClose();
  };

  return (
    <Modal open={open} title="Help & Customer Support" onClose={handleClose}>
      {success ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="mb-4 text-cyan-400" size={48} />
          <h3 className="text-xl font-bold text-white">Success!</h3>
          <p className="mt-2 text-slate-300">Aapki query send ho chuki hai. Hum jald hi aapse contact karenge!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-cyan-950/30 p-3 text-sm text-cyan-300">
            <Mail size={16} />
            <span>Direct contact: <strong>PyMeetcustomersupport@gmail.com</strong></span>
          </div>
          
          <div className="flex flex-col gap-1">
            <label htmlFor="query" className="text-sm font-medium text-slate-300">
              Explain your problem (Max 100 words):
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your query here..."
              className={`h-32 resize-none rounded-lg border bg-ink/50 p-3 text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 ${
                isOverLimit ? "border-red-500 focus:border-red-500" : "border-line"
              }`}
            />
            <div className={`text-xs mt-1 flex justify-between ${isOverLimit ? "text-red-400" : "text-slate-400"}`}>
              <span>{isOverLimit ? "Limit exceeded!" : ""}</span>
              <span>{wordCount} / 100 words</span>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={isOverLimit || !query.trim()}
            >
              Submit Query
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
