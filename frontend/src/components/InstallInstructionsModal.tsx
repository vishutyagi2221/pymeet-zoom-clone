import { Modal } from "./Modal";
import { Download, Share, PlusSquare, MoreVertical } from "lucide-react";
import { Button } from "./Button";

interface InstallInstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstallInstructionsModal({ open, onClose }: InstallInstructionsModalProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <Modal open={open} onClose={onClose} title="Install PyMeet">
      <div className="space-y-6 pt-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-400">
            <Download size={32} />
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Add to Home Screen</h3>
          <p className="mt-2 text-sm text-slate-300">
            PyMeet works best as a native app! Follow the instructions below to install it on your device.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white/5 p-4">
          {isIOS ? (
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10"><Share size={14} /></span>
                Tap the Share button in Safari
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10"><PlusSquare size={14} /></span>
                Select "Add to Home Screen"
              </li>
            </ul>
          ) : (
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10"><MoreVertical size={14} /></span>
                Tap the browser menu (⋮)
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10"><Download size={14} /></span>
                Select "Install app" or "Add to Home screen"
              </li>
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="secondary">Got it</Button>
        </div>
      </div>
    </Modal>
  );
}
