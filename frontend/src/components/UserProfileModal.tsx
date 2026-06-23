import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";
import toast from "react-hot-toast";

export function UserProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setPassword("");
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateProfile(name, password);
      toast.success("Profile updated successfully!");
      setPassword(""); // Clear password field after success
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
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
          <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="profile-password">
            New Password (Optional)
          </label>
          <input 
            id="profile-password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Leave blank to keep current password" 
            minLength={8}
            className="w-full rounded-lg border border-line bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

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
