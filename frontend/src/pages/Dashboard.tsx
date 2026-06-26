import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Plus, Users, Video } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { meetingApi } from "../services/api";
import type { Meeting } from "../types";

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingId, setMeetingId] = useState("");
  useEffect(() => { meetingApi.list().then(({ data }) => setMeetings(data)).catch(() => setMeetings([])); }, []);
  const [joinError, setJoinError] = useState("");
  const join = async () => {
    if (!meetingId.trim()) return;
    setJoinError("");
    try {
      const { data } = await meetingApi.join(meetingId.trim());
      navigate(`/meeting/${data.meeting_id}`);
    } catch {
      setJoinError("Meeting not found or could not join.");
    }
  };
  return (
    <div className="bg-premium min-h-screen text-white"><Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8"><p className="text-sm font-semibold text-cyan-300">Dashboard</p><h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">Welcome, {user?.name}</h1><p className="mt-3 max-w-2xl text-slate-300">Create a room, invite teammates, or jump back into a recent conversation.</p></header>
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="bg-gradient-to-br from-cyan-400/25 to-fuchsia-400/15 p-6"><div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-300 text-slate-950"><Video size={28} /></div><h2 className="text-2xl font-bold">Create Meeting</h2><p className="mt-2 text-slate-300">Start a secure room with waiting room and host controls.</p><Link to="/create"><Button className="mt-6"><Plus size={18} /> Create Meeting</Button></Link></Card>
          <Card className="p-6"><h2 className="text-2xl font-bold">Join Meeting</h2><p className="mt-2 text-slate-400">Enter a meeting ID shared by your host.</p><div className="mt-6 flex gap-2"><input value={meetingId} onChange={(e) => setMeetingId(e.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-lg border border-line bg-white/10 px-4 py-3 outline-none focus:border-cyan-300" placeholder="ABCD-EF12-3456" /><Button onClick={join}>Join</Button></div>{joinError && <p className="mt-2 text-sm text-red-400">{joinError}</p>}</Card>
        </section>
        <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Recent Meetings</h2><Link to="/join" className="text-sm font-semibold text-cyan-300">Join by ID</Link></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {meetings.map((meeting) => <Card key={meeting.id} className="p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{meeting.title}</h3><span className="rounded bg-white/10 px-2 py-1 text-xs">{meeting.meeting_id}</span></div><div className="flex items-center gap-4 text-sm text-slate-400"><span className="flex items-center gap-1"><CalendarDays size={15} /> {new Date(meeting.created_at).toLocaleDateString()}</span><span className="flex items-center gap-1"><Users size={15} /> {meeting.participants.length}</span></div><Button variant="secondary" className="mt-4 w-full" onClick={() => navigate(`/meeting/${meeting.meeting_id}`)}>Open</Button></Card>)}
          {!meetings.length && <Card className="p-6 text-slate-400">No meetings yet. Your meeting history will appear here.</Card>}
        </div></section>
      </main>
    </div>
  );
}
