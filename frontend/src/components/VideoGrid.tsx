import { memo } from "react";
import type { RoomParticipant } from "../types";
import { VideoTile } from "./VideoTile";

interface VideoGridProps {
  localStream: MediaStream | null;
  localUser?: RoomParticipant;
  remoteStreams: Array<{ sid: string; stream: MediaStream; participant?: RoomParticipant }>;
  cameraEnabled: boolean;
  screenSharing: boolean;
  audioOutputDeviceId?: string;
}

export const VideoGrid = memo(function VideoGrid({ localStream, localUser, remoteStreams, cameraEnabled, screenSharing, audioOutputDeviceId }: VideoGridProps) {
  const total = remoteStreams.length + 1;

  // Zoom-like grid columns based on participant count
  let gridClass: string;
  if (total === 1) {
    gridClass = "grid-cols-1";
  } else if (total === 2) {
    gridClass = "grid-cols-1 sm:grid-cols-2";
  } else if (total <= 4) {
    gridClass = "grid-cols-2";
  } else if (total <= 6) {
    gridClass = "grid-cols-2 lg:grid-cols-3";
  } else if (total <= 9) {
    gridClass = "grid-cols-2 md:grid-cols-3";
  } else {
    gridClass = "grid-cols-2 md:grid-cols-3 xl:grid-cols-4";
  }

  // For 1-2 participants, make tiles larger and fill the screen better
  const sizeClass = total <= 2 ? "w-full max-w-7xl mx-auto" : "w-full";

  return (
    <div className={`grid h-full auto-rows-fr gap-2 p-1 ${gridClass} ${sizeClass} items-center content-center`}>
      <VideoTile
        stream={localStream}
        participant={localUser}
        isLocal
        muted
        cameraEnabled={cameraEnabled}
        active={total === 1}
        screen={screenSharing}
      />
      {remoteStreams.map((item) => (
        <VideoTile
          key={item.sid}
          stream={item.stream}
          participant={item.participant}
          active={false}
          cameraEnabled={item.participant?.cameraEnabled !== false}
          muted={item.participant?.micEnabled === false}
          audioOutputDeviceId={audioOutputDeviceId}
        />
      ))}
    </div>
  );
});
