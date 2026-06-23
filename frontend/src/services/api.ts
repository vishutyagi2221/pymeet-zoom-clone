import axios from "axios";
import type { Meeting, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pymeet_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) => api.post<AuthResponse>("/api/auth/register", payload),
  login: (payload: { email: string; password: string }) => api.post<AuthResponse>("/api/auth/login", payload),
  me: () => api.get<User>("/api/auth/me"),
  updateProfile: (payload: { name?: string; password?: string }) => api.put<User>("/api/auth/me", payload)
};

export const meetingApi = {
  create: (payload: { title: string; waiting_room_enabled: boolean }) => api.post<Meeting>("/api/meetings", payload),
  list: () => api.get<Meeting[]>("/api/meetings"),
  get: (meetingId: string) => api.get<Meeting>(`/api/meetings/${meetingId}`),
  join: (meeting_id: string) => api.post<Meeting>("/api/meetings/join", { meeting_id })
};


