export type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY: string;
  OPENAI_API_BASE?: string;
  ELEVENLABS_API_KEY: string;
}

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type MessageRole = 'user' | 'assistant';

export interface User {
  id: number;
  username: string;
  email?: string;
  level: Level;
  created_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  topic: string;
  level: Level;
  started_at: string;
  ended_at?: string;
  total_messages: number;
}

export interface Message {
  id: number;
  session_id: number;
  role: MessageRole;
  content: string;
  audio_url?: string;
  transcription?: string;
  created_at: string;
}

export interface Topic {
  id: number;
  name: string;
  description: string;
  level: Level;
  system_prompt: string;
  icon: string;
}

export interface UserStats {
  id: number;
  user_id: number;
  date: string;
  total_sessions: number;
  total_messages: number;
  total_minutes: number;
}
