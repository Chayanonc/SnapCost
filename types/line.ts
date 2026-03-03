// ── Types ────────────────────────────────────────────────────────────────────
export interface LineEvent {
  type: string;
  replyToken: string;
  message: LineMessage;
  source?: {
    type: "user" | "group" | "room";
    userId?: string;
  };
}

export interface LineMessage {
  /** Unique message ID — used to fetch binary content */
  id: string;
  /** 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker' */
  type: string;
  /** Only present when type === 'text' */
  text?: string;
  /** Only present when type === 'file' */
  fileName?: string;
  /** Only present when type === 'file' */
  fileSize?: number;
}
