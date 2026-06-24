import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoadingScreen } from "./components/LoadingScreen";
const Login = React.lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Register = React.lazy(() => import("./pages/Register").then(m => ({ default: m.Register })));
const Dashboard = React.lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const CreateMeeting = React.lazy(() => import("./pages/CreateMeeting").then(m => ({ default: m.CreateMeeting })));
const JoinMeeting = React.lazy(() => import("./pages/JoinMeeting").then(m => ({ default: m.JoinMeeting })));
const MeetingRoom = React.lazy(() => import("./pages/MeetingRoom").then(m => ({ default: m.MeetingRoom })));
import { ThemeProvider } from "./context/ThemeContext";
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

const isElectron = navigator.userAgent.toLowerCase().includes('electron');
const Router = isElectron ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <React.Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<Public><Login /></Public>} />
              <Route path="/register" element={<Public><Register /></Public>} />
              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/create" element={<Protected><CreateMeeting /></Protected>} />
              <Route path="/join" element={<Protected><JoinMeeting /></Protected>} />
              <Route path="/meeting/:meetingId" element={<Protected><MeetingRoom /></Protected>} />
            </Routes>
          </React.Suspense>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
