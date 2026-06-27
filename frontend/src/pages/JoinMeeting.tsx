import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { meetingApi } from "../services/api";

export function JoinMeeting() {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (!meetingId.trim() || busy) return;
    setBusy(true);
    try { const { data } = await meetingApi.join(meetingId.trim()); navigate(`/meeting/${data.meeting_id}`); } catch { setError("Meeting not found or no longer active."); } finally { setBusy(false); }
  };
  return <div className="bg-premium min-h-screen text-white"><Navbar /><main className="mx-auto grid max-w-2xl place-items-center px-4 py-12"><Card className="w-full p-6"><h1 className="text-3xl font-bold">Join a meeting</h1><form onSubmit={submit} className="mt-6 space-y-4"><input value={meetingId} onChange={(e) => setMeetingId(e.target.value.toUpperCase())} className="w-full rounded-lg border border-line bg-white/10 px-4 py-3 text-lg tracking-wide outline-none focus:border-cyan-300" placeholder="ABCD-EF12-3456" />{error && <p className="text-sm text-rose-300">{error}</p>}<Button disabled={busy} className="w-full">{busy ? "Joining..." : "Join meeting"}</Button></form></Card></main></div>;
}
