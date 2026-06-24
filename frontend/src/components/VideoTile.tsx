import { MicOff, MonitorUp, VideoOff } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import type { RoomParticipant } from "../types";

interface VideoTileProps {
  stream: MediaStream | null;
  participant?: Partial<RoomParticipant>;
  isLocal?: boolean;
  muted?: boolean;
  cameraEnabled?: boolean;
  active?: boolean;
  screen?: boolean;
  audioOutputDeviceId?: string;
}

export const VideoTile = memo(function VideoTile({ stream, participant, isLocal = false, muted = false, cameraEnabled = true, active = false, screen = false, audioOutputDeviceId }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {/* autoplay blocked — user interaction needed */});
    } else {
      video.srcObject = null;
    }

    const handleTrackChange = () => {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => {});
    };

    stream?.addEventListener("addtrack", handleTrackChange);
    stream?.addEventListener("removetrack", handleTrackChange);

    return () => {
      stream?.removeEventListener("addtrack", handleTrackChange);
      stream?.removeEventListener("removetrack", handleTrackChange);
    };
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !audioOutputDeviceId || typeof (video as any).setSinkId !== "function") return;
    
    // setSinkId routes the audio to the selected speaker
    (video as any).setSinkId(audioOutputDeviceId).catch((err: any) => {
      console.warn("Error setting audio output device:", err);
    });
  }, [audioOutputDeviceId]);

  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");
  const showVideo = cameraEnabled && hasVideo;
  const initials = (participant?.name || "Guest").split(" ").map((p) => p[0] || "").join("").slice(0, 2).toUpperCase();

  return (
    <div className={`group relative flex items-center justify-center overflow-hidden rounded-xl border bg-slate-900 shadow-soft transition-all ${
      active ? "border-cyan-300 ring-2 ring-cyan-300/40" : "border-line"
    }`} style={{ aspectRatio: "16/9", minHeight: "160px" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${showVideo && !(isLocal && screen) ? "opacity-100" : "opacity-0"}`}
        style={isLocal && !screen ? { transform: "scaleX(-1)" } : undefined}
      />
      {isLocal && screen ? (
        <div className="z-10 flex flex-col items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-800/80 text-cyan-400 border border-slate-700 shadow-lg">
            <MonitorUp size={28} />
          </div>
          <span className="text-sm font-medium text-slate-200">You are sharing your screen</span>
          <span className="max-w-[200px] text-xs text-slate-400">Everyone can see your screen.</span>
        </div>
      ) : !showVideo && (
        <div className="z-10 flex flex-col items-center gap-2">
          <div
            className="grid h-16 w-16 place-items-center rounded-full text-xl font-bold text-white sm:h-20 sm:w-20 sm:text-2xl"
            style={{ background: participant?.avatar_color || "#2563eb" }}
          >
            {initials}
          </div>
          <span className="text-xs text-slate-400">{isLocal ? "Camera off" : participant?.name || ""}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-white">
        <span className="rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
          {isLocal ? "You" : participant?.name || "Participant"}
        </span>
        <div className="flex items-center gap-1.5 text-slate-200">
          {screen && <MonitorUp size={14} />}
          {!cameraEnabled && <VideoOff size={14} />}
          {muted && !isLocal && <MicOff size={14} />}
        </div>
      </div>
    </div>
  );
});
