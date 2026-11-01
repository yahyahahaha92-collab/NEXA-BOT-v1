// Levels: .مستوى (my level)  |  .ترتيب (top 10)  + small XP for chatting
const LEVELS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17500, 20000];
const NAMES = ['🎪 مشاهد', '🎭 متدرب سيرك', '🤡 مهرج صغير', '🎪 لاعب أكروبات', '🎭 ساحر مبتدئ', '🤹 لاعب نار', '🎪 مروض أسود', '🎭 ساحر الظل', '🤡 مهرج الأكاذيب', '🎪 نجم السيرك', '🎭 وهمي', '🤹 سيد الألعاب', '🎪 مدير الحلبة', '🎭 أسطورة السيرك', '🤡 كابوس المهرج', '🎪 ساحر الأوهام', '🎭 مخرج العجائب', '🤹 سيد الخواتم', '🎪 إمبراطور السيرك', '🎭 حارس البوابة', '🌀 الرقمي الأوحد'];

const levelOf = (xp) => { let l = 0; for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) l = i; return l; };
const bar = (p) => '🟩'.repeat(Math.floor(p / 10)) + '⬛'.repeat(10 - Math.floor(p / 10));

const handler = async (m, { conn, command }) => {
  const users = global.db?.users || {};

  if (['مستوى', 'level', 'لفل'].includes(command)) {
    const target = (m.mentionedJid && m.mentionedJid[0]) || m.sender;
    const u = users[target];
    if (!u) return m.reply('*⚠️ مفيش بيانات لـ المستخدم ده*\nسجّل الأول بـ: .تسجيل الاسم|العمر ثم استخدم .يومي');
    const xp = u.xp || 0;
    const lvl = levelOf(xp);
    const cur = LEVELS[lvl], next = LEVELS[lvl + 1];
    const pct = next ? Math.floor(((xp - cur) / (next - cur)) * 100) : 100;
    return conn.sendMessage(m.chat, {
      text: `*🏅 مستوى @${target.split('@')[0]}*\n\n🎭 اللقب: ${NAMES[lvl]}\n📊 المستوى: *${lvl}*\n⭐ النقاط: *${xp}*${next ? ` / ${next}` : ' (أعلى مستوى)'}\n${bar(pct)} ${pct}%`,
      mentions: [target]
    }, { quoted: m });
  }

  // top 10
  const list = Object.entries(users).filter(([, u]) => (u.xp || 0) > 0).sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0)).slice(0, 10);
  if (!list.length) return m.reply('*📭 لسه مفيش حد معاه نقاط*\nجرب الألعاب أو .يومي');
  const medals = ['🥇', '🥈', '🥉'];
  const lines = list.map(([jid, u], i) => `${medals[i] || `*${i + 1}.*`} @${jid.split('@')[0]} — ${u.xp || 0} نقطة (مستوى ${levelOf(u.xp || 0)})`);
  return conn.sendMessage(m.chat, { text: `*🏆 ترتيب أعلى 10*\n\n${lines.join('\n')}`, mentions: list.map(([j]) => j) }, { quoted: m });
};

// small XP for chatting (only for users who already have data), 5 XP every 30 seconds
const last = new Map();
handler.before = async (m) => {
  try {
    const u = global.db?.users?.[m.sender];
    if (!u || m.fromMe) return false;
    const now = Date.now();
    if (now - (last.get(m.sender) || 0) < 30000) return false;
    last.set(m.sender, now);
    u.xp = (u.xp || 0) + 5;
  } catch {}
  return false;
};

handler.usage = ['مستوى', 'ترتيب'];
handler.category = 'levels';
handler.command = ['مستوى', 'level', 'لفل', 'ترتيب', 'top_level', 'توب_مستوى'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'rank');
