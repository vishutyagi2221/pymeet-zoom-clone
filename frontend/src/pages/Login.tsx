import axios from "axios";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, MessageSquare, Shield, Sparkles, Video } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (requestError) {
      if (!axios.isAxiosError(requestError) || !requestError.response) {
        setError("Cannot connect to PyMeet. Open the HTTPS link and check your network.");
      } else if (requestError.response.status === 401) {
        setError("Invalid email or password.");
      } else if (requestError.response.status === 429) {
        setError("Too many login attempts. Please wait a minute and try again.");
      } else if (requestError.response.status === 422) {
        setError("Enter a valid email address and password.");
      } else {
        const detail = requestError.response.data?.detail;
        setError(typeof detail === "string" ? detail : "Login failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="bg-premium grid min-h-screen grid-cols-1 text-white lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between p-6 lg:p-12">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-400 text-slate-950"><Video size={24} /></span><span className="text-2xl font-extrabold">PyMeet</span></div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="my-16 max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Premium meetings for teams that move fast.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">Launch secure video rooms, collaborate in real time, and keep every conversation close to the work.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[{ icon: Shield, label: "JWT secured" }, { icon: MessageSquare, label: "Live chat" }, { icon: Sparkles, label: "Screen share" }].map((item) => <Card key={item.label} className="p-4"><item.icon className="mb-4 text-cyan-300" size={22} /><p className="text-sm font-semibold">{item.label}</p></Card>)}
          </div>
        </motion.div>
        <p className="text-sm text-slate-500">Built with FastAPI, React, WebRTC, and Socket.IO.</p>
      </section>
      <section className="grid place-items-center p-6">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6"><h2 className="text-2xl font-bold">Welcome back</h2><p className="mt-2 text-sm text-slate-400">Sign in to create or join a meeting.</p></div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="you@company.com" /></label>
            <label className="block text-sm font-medium">Password<div className="relative mt-2"><Lock className="absolute left-3 top-3.5 text-slate-500" size={18} /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full rounded-lg border border-line bg-white/10 px-10 py-3 outline-none focus:border-cyan-300" placeholder="Your password" /></div></label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <Button disabled={busy} className="w-full py-3">{busy ? "Signing in..." : "Login"}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">New to PyMeet? <Link to="/register" className="font-semibold text-cyan-300">Create an account</Link></p>
        </Card>
      </section>
    </main>
  );
}

