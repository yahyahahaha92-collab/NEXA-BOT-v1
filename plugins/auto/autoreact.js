import { isAllowed } from '../../system/maingroup.js';
// Auto-react to incoming messages with a random emoji.
// Control with the owner command: .تفاعل تشغيل | .تفاعل ايقاف
const EMOJIS = ['❤️', '😂', '🔥', '👍', '😍', '🤩', '😎', '🎉', '💯', '🙏', '😮', '🥰', '👏', '✨', '💙', '🌹', '🤝', '😊', '🎪', '🖤', '💜', '😁', '🤗', '⚡', '🌟', '🥳', '😇', '💫', '🦋', '🍀'];
const COOLDOWN_MS = 2000;      // minimum gap between reactions in the same chat
const CHANCE = 1;              // 1 = react to every message, 0.5 = about half
const last = new Map();

export default async function before(m, { conn, bot }) {
  if (!(await isAllowed(m, conn))) return false;
  try {
    if (global.autoReact === false) return false;
    if (m.fromMe || !m.chat) return false;
    if (m.chat === 'status@broadcast' || String(m.chat).endsWith('@newsletter')) return false;
    if (/^[./!]/.test(String(m.text || ''))) return false;   // commands get their own emoji
    if (Math.random() > CHANCE) return false;

    const now = Date.now();
    if (now - (last.get(m.chat) || 0) < COOLDOWN_MS) return false;
    last.set(m.chat, now);

    await m.react(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  } catch (e) {
    console.error('[AUTOREACT]', e?.message || e);
  }
  return false;
}
