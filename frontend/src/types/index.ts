export interface User {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
  created_at: string;
}

export interface ParticipantRecord {
  id: number;
  user: User;
  joined_at: string;
  left_at?: string | null;
  was_removed: boolean;
}

export interface Meeting {
  id: number;
  meeting_id: string;
  title: string;
  waiting_room_enabled: boolean;
  is_active: boolean;
  created_at: string;
  ended_at?: string | null;
  host: User;
  participants: ParticipantRecord[];
}

export interface RoomParticipant {
  sid: string;
  id: number;
  name: string;
  email: string;
  avatar_color: string;
  is_host: boolean;
  is_waiting?: boolean;
}

export interface ChatMessage {
  id: string;
  message: string;
  user: RoomParticipant;
  sentAt: string;
}
