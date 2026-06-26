import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { meetingApi } from "../services/api";

export function CreateMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("PyMeet Meeting");
  const [waiting, setWaiting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = await meetingApi.create({ title, waiting_room_enabled: waiting });
      navigate(`/meeting/${data.meeting_id}`);
    } catch {
      setError("Failed to create meeting. Please try again.");
      setBusy(false);
    }
  };
  return <div className="bg-premium min-h-screen text-white"><Navbar /><main className="mx-auto grid max-w-3xl place-items-center px-4 py-12"><Card className="w-full p-6"><h1 className="text-3xl font-bold">Create a meeting</h1>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<form onSubmit={submit} className="mt-6 space-y-5"><label className="block text-sm font-medium">Meeting title<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" /></label><label className="flex items-center justify-between rounded-lg border border-line bg-white/5 p-4"><span><span className="block font-medium">Waiting room</span><span className="text-sm text-slate-400">Let the host admit participants.</span></span><input type="checkbox" checked={waiting} onChange={(e) => setWaiting(e.target.checked)} className="h-5 w-5 accent-cyan-300" /></label><Button disabled={busy}>{busy ? "Creating..." : "Create Meeting"}</Button></form></Card></main></div>;
}
