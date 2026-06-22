import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { CreateMeeting } from "./pages/CreateMeeting";
import { JoinMeeting } from "./pages/JoinMeeting";
import { MeetingRoom } from "./pages/MeetingRoom";
import "./index.css";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Public({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/create" element={<Protected><CreateMeeting /></Protected>} />
          <Route path="/join" element={<Protected><JoinMeeting /></Protected>} />
          <Route path="/meeting/:meetingId" element={<Protected><MeetingRoom /></Protected>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
