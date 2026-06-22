import { CheckCircle2, Home, LogIn, Sparkles, Video } from "lucide-react";
import { Button } from "./Button";

interface MeetingExitScreenProps {
  meetingTitle: string;
  meetingId: string;
  message: string;
  onDashboard: () => void;
  onJoinAnother: () => void;
}

export function MeetingExitScreen({ meetingTitle, meetingId, message, onDashboard, onJoinAnother }: MeetingExitScreenProps) {
  return (
    <main className="bg-premium relative grid min-h-screen place-items-center overflow-hidden p-6 text-white">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 p-7 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-fuchsia-400/10 blur-2xl" />
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950 shadow-glow">
          <CheckCircle2 size={40} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
          <Sparkles size={16} /> Meeting complete
        </div>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">Thanks for joining!</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">{message}</p>

        <div className="mx-auto mt-7 flex max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-cyan-400/15 text-cyan-300"><Video size={21} /></span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{meetingTitle}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">Meeting ID · {meetingId}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="sm:min-w-44" onClick={onDashboard}><Home size={18} /> Back to dashboard</Button>
          <Button variant="secondary" className="sm:min-w-44" onClick={onJoinAnother}><LogIn size={18} /> Join another</Button>
        </div>
        <p className="mt-8 text-xs text-slate-500">Your camera and microphone have been disconnected safely.</p>
      </section>
    </main>
  );
}
