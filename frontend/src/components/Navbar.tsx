import { LogOut, Settings, Video, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { SupportModal } from "./SupportModal";
import { UserProfileModal } from "./UserProfileModal";
import { useTheme } from "../context/ThemeContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-20 border-b border-line bg-ink/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-white"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-slate-950"><Video size={20} /></span><span className="text-lg font-bold">PyMeet</span></Link>
          <div className="flex items-center gap-3">
            
            {/* Settings Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10" 
                aria-label="Settings"
              >
                <Settings 
                  size={18} 
                  className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-90" : "rotate-0"}`} 
                />
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-line bg-slate-900 shadow-soft">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                    <span className="text-sm text-slate-200">Theme</span>
                    <button 
                      onClick={toggleTheme}
                      className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
                      aria-label="Toggle Theme"
                    >
                      {theme === 'dark' ? (
                        <Moon size={18} className="text-yellow-400 fill-yellow-400" />
                      ) : (
                        <Sun size={18} className="text-yellow-500 fill-yellow-500" />
                      )}
                    </button>
                  </div>
                  {user && (
                    <button 
                      onClick={() => {
                        setIsProfileOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
                    >
                      My Profile
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setIsSupportOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
                  >
                    Help & Support
                  </button>
                </div>
              )}
            </div>

            {user && <div className="flex items-center gap-2 rounded-lg border border-line bg-white/5 px-2 py-1.5 text-white"><span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold" style={{ background: user.avatar_color }}>{user.name[0]}</span><span className="hidden text-sm sm:block">{user.name}</span></div>}
            <button onClick={logout} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Logout"><LogOut size={18} /></button>
          </div>
        </div>
      </nav>
      <SupportModal open={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <UserProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
