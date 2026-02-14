export interface ChatMessage {
  username: string;
  message: string;
  timestamp: string;
}

export interface InboxEntry {
  from: string;
  text: string;
  summary: string;
  timestamp: string;
  color?: string;
  read: boolean;
}
