import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoadingScreen } from "./components/LoadingScreen";
const lazyImport = (factory: () => Promise<any>) => React.lazy(() => 
  factory().catch((error) => {
    console.error("Chunk load error:", error);
    window.location.reload();
    return Promise.reject(error);
  })
);

const Login = lazyImport(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Register = lazyImport(() => import("./pages/Register").then(m => ({ default: m.Register })));
const Dashboard = lazyImport(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const CreateMeeting = lazyImport(() => import("./pages/CreateMeeting").then(m => ({ default: m.CreateMeeting })));
const JoinMeeting = lazyImport(() => import("./pages/JoinMeeting").then(m => ({ default: m.JoinMeeting })));
const MeetingRoom = lazyImport(() => import("./pages/MeetingRoom").then(m => ({ default: m.MeetingRoom })));
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function Public({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;
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
              <Route path="/join/:meetingId" element={<Protected><JoinMeeting /></Protected>} />
              <Route path="/meeting/:meetingId" element={<Protected><MeetingRoom /></Protected>} />
            </Routes>
          </React.Suspense>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
