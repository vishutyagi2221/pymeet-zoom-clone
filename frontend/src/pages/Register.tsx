import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video, Mail, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export function Register() {
  const { register, sendOtp } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState(59);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async () => {
    setError("");
    if (form.name.trim().length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const mockOtp = await sendOtp(form.email);
      // For mock testing, we show the OTP in a toast!
      toast.success(`Mock Email Sent! OTP: ${mockOtp}`, { duration: 8000, icon: '📧' });
      setStep(2);
      setTimer(59);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (form.otp.length !== 6) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    setBusy(true);
    try {
      await register(form.name, form.email, form.password, form.otp);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid or expired OTP.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      await handleSendOtp();
    } else {
      await handleVerifyOtp();
    }
  };

  return (
    <main className="bg-premium grid min-h-screen place-items-center p-6 text-white">
      <Card className="w-full max-w-md p-6">
        
        {step === 1 ? (
          <>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400 text-slate-950">
                <Video size={22} />
              </span>
              <div>
                <h1 className="text-2xl font-bold">Create your PyMeet account</h1>
                <p className="text-sm text-slate-400">Start meeting in under a minute.</p>
              </div>
            </div>
            
            <form onSubmit={submit} className="space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} className="w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="Full name" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required className="w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="Email Address" />
              <div>
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required minLength={8} maxLength={128} className="w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="Password" />
                <p className="mt-1 text-xs text-slate-400">Use at least 8 characters.</p>
              </div>
              
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <Button disabled={busy} className="w-full py-3">{busy ? "Sending OTP..." : "Continue"}</Button>
              
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                <div className="relative bg-slate-900 px-4 text-xs uppercase text-slate-500">Or continue with</div>
              </div>
              
              <button 
                type="button" 
                onClick={() => {
                  setForm({ ...form, name: "Google User", email: "mockuser@gmail.com", password: "SecurePassword123" });
                  toast("Mock Google Account selected. Click Continue to send OTP.");
                }} 
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-white/5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                Google (Mock)
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-400">Already registered? <Link to="/login" className="font-semibold text-cyan-300">Login</Link></p>
          </>
        ) : (
          <>
            <div className="mb-6">
              <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400 text-slate-950">
                  <Mail size={22} />
                </span>
                <div>
                  <h1 className="text-2xl font-bold">Verify your email</h1>
                  <p className="text-sm text-slate-400">We've sent a 6-digit code to <br/><span className="font-semibold text-slate-200">{form.email}</span></p>
                </div>
              </div>
            </div>
            
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center">
                <input 
                  value={form.otp} 
                  onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })} 
                  type="text" 
                  required 
                  maxLength={6} 
                  className="w-full text-center tracking-widest text-2xl font-bold rounded-lg border border-line bg-white/10 px-4 py-4 outline-none focus:border-cyan-300" 
                  placeholder="------" 
                />
              </div>
              
              {error && <p className="text-sm text-center text-rose-300">{error}</p>}
              
              <Button disabled={busy || form.otp.length !== 6} className="w-full py-3">
                {busy ? "Verifying..." : "Create Account"}
              </Button>
              
              <div className="text-center mt-4">
                {timer > 0 ? (
                  <p className="text-sm text-slate-400">Resend code in <span className="font-bold text-slate-200">{timer}s</span></p>
                ) : (
                  <button 
                    type="button"
                    onClick={handleSendOtp} 
                    className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
