import { useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function useSocket(token: string | null): Socket | null {
  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token }
    });
  }, [token]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return socket;
}


