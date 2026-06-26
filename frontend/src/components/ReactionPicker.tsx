import { SmilePlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "👏"];

export function ReactionPicker({ onSelectReaction }: { onSelectReaction: (emoji: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-slate-900 p-2 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                onSelectReaction(emoji);
                setIsOpen(false);
              }}
              className="grid h-10 w-10 place-items-center rounded-full text-2xl transition-all hover:scale-125 active:scale-90 focus:outline-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <Button
        title="Send a reaction"
        variant="secondary"
        className="h-11 w-11 rounded-lg px-0"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <SmilePlus size={19} className={isOpen ? "text-primary" : ""} />
      </Button>
    </div>
  );
}
