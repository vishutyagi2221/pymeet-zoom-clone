import { LogOut, Plus, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-white">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-400 text-slate-950"><Video size={20} /></span>
          <span className="text-lg font-bold">PyMeet</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/create" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 sm:flex"><Plus size={16} /> Create</Link>
          <Link to="/join" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 sm:block">Join</Link>
          {user && (
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-white/5 px-2 py-1.5 text-white">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: user.avatar_color }}>{user.name[0]}</span>
              <span className="hidden max-w-40 truncate text-sm sm:block">{user.name}</span>
            </div>
          )}
          <button onClick={logout} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Logout"><LogOut size={18} /></button>
        </div>
      </div>
    </nav>
  );
}
