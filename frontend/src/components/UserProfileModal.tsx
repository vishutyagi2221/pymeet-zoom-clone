import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";

export function UserProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync state when modal opens
  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setCurrentPassword("");
      setNewPassword("");
      setResetToken("");
      setForgotMode(false);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    
    if (newPassword && !currentPassword && !forgotMode) {
      setError("Please enter your current password to set a new one");
      return;
    }
    
    if (forgotMode && newPassword && resetToken !== "123456") {
      setError("Invalid security code");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateProfile(name, currentPassword, newPassword, forgotMode ? resetToken : undefined);
      setSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setResetToken("");
      setForgotMode(false);
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="My Profile" onClose={onClose}>
      <div className="flex flex-col items-center mb-6 mt-2">
        <div 
          className="grid h-20 w-20 place-items-center rounded-full text-3xl font-bold shadow-lg border border-slate-700 text-white" 
          style={{ background: user?.avatar_color || "#2563eb" }}
        >
          {user?.name?.[0]?.toUpperCase() || <User size={32} />}
        </div>
        <p className="mt-3 font-semibold text-white text-lg">{user?.name}</p>
        <p className="text-sm text-slate-400">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="profile-email">
            Email Address
          </label>
          <input 
            id="profile-email" 
            type="email" 
            value={user?.email || ""} 
            disabled 
            className="w-full rounded-lg border border-line bg-slate-900/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-500">Email cannot be changed.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="profile-name">
            Display Name
          </label>
          <input 
            id="profile-name" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Enter your name" 
            required 
            className="w-full rounded-lg border border-line bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">Change Password</label>
            {!forgotMode ? (
              <button 
                type="button" 
                onClick={() => setForgotMode(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Forgot Password?
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setForgotMode(false)}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Cancel Reset
              </button>
            )}
          </div>
          
          {forgotMode ? (
            <div className="mb-3 rounded-lg border border-cyan-900/50 bg-cyan-900/20 p-3">
              <p className="mb-2 text-xs text-cyan-200">Enter security code <span className="font-bold">123456</span> to reset your password (Mock Verification).</p>
              <input 
                type="text" 
                value={resetToken} 
                onChange={(e) => setResetToken(e.target.value)} 
                className="w-full rounded-lg border border-line bg-ink px-4 py-2.5 text-white outline-none focus:border-cyan-300 tracking-widest text-center font-mono"
                placeholder="------"
                maxLength={6}
              />
            </div>
          ) : (
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              className="mb-3 w-full rounded-lg border border-line bg-ink px-4 py-2.5 text-white outline-none focus:border-cyan-300"
              placeholder="Current Password"
            />
          )}
          
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            className="w-full rounded-lg border border-line bg-ink px-4 py-2.5 text-white outline-none focus:border-cyan-300"
            placeholder="New Password"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="mt-4 w-full rounded-lg bg-cyan-400 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
}
