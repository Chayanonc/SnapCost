// ── Constants ─────────────────────────────────────────────────────────────────
export const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;
export const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
export const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";
export const LINE_CONTENT_API = "https://api-data.line.me/v2/bot/message";
export const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
export const GEMINI_MODEL = process.env.GEMINI_MODEL! || "gemini-2.5-flash";
