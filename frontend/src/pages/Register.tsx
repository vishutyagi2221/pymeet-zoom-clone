import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
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
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: any) => item?.msg).filter(Boolean).join(" ")
          : "Unable to create account. Please try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="bg-premium grid min-h-screen place-items-center p-6 text-white">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400 text-slate-950"><Video size={22} /></span><div><h1 className="text-2xl font-bold">Create your PyMeet account</h1><p className="text-sm text-slate-400">Start meeting in under a minute.</p></div></div>
        <form onSubmit={submit} className="space-y-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} className="w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="Full name" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required className="w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="Email" />
          <div>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required minLength={8} maxLength={128} className="w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="Password" />
            <p className="mt-1 text-xs text-slate-400">Use at least 8 characters.</p>
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button disabled={busy} className="w-full py-3">{busy ? "Creating..." : "Register"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-400">Already registered? <Link to="/login" className="font-semibold text-cyan-300">Login</Link></p>
      </Card>
    </main>
  );
}
