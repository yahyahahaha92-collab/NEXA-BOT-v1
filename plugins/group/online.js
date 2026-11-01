// .متصلين -> lists members who are online right now (best effort)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const handler = async (m, { conn }) => {
  if (!m.isGroup) throw '❌ هذا الأمر يعمل داخل الجروبات فقط';
  if (!conn.ev || !conn.presenceSubscribe) throw '❌ هذه الميزة غير مدعومة في نسخة المكتبة الحالية';

  await m.react('🔎');
  const meta = await conn.groupMetadata(m.chat);
  const members = (meta.participants || []).slice(0, 80).map(p => ({
    show: p.phoneNumber || p.jid || p.id,
    ids: [p.id, p.jid, p.phoneNumber, p.lid].filter(Boolean)
  }));

  const byId = new Map();
  for (const mem of members) for (const id of mem.ids) byId.set(id, mem);

  const online = new Set();
  const typing = new Set();
  const listener = (u) => {
    for (const [jid, p] of Object.entries(u?.presences || {})) {
      const mem = byId.get(jid);
      if (!mem) continue;
      const st = p?.lastKnownPresence;
      if (st === 'available') online.add(mem.show);
      if (st === 'composing' || st === 'recording') { online.add(mem.show); typing.add(mem.show); }
    }
  };

  conn.ev.on('presence.update', listener);
  try {
    for (const mem of members) {
      try { await conn.presenceSubscribe(mem.ids[0]); } catch {}
      await sleep(120);
    }
    await sleep(6000);
  } finally {
    conn.ev.off?.('presence.update', listener);
  }

  const list = [...online];
  if (!list.length) {
    return m.reply('*🔴 ما قدرت أحدد أحد متصل الآن*\n\n> واتساب لا يعطي حالة الاتصال لمن يخفيها (آخر ظهور/متصل) أو لم يفتح التطبيق، فالنتيجة تقريبية.');
  }
  const lines = list.map(j => `• @${String(j).split('@')[0]}${typing.has(j) ? ' ✍️' : ''}`);
  return conn.sendMessage(m.chat, {
    text: `*🟢 المتصلين الآن (${list.length})*\n\n${lines.join('\n')}\n\n> النتيجة تقريبية: من يخفي حالة اتصاله لا يظهر.`,
    mentions: list.map(j => (String(j).includes('@') ? j : `${j}@s.whatsapp.net`))
  }, { quoted: m });
};

handler.usage = ['متصلين'];
handler.category = 'group';
handler.command = ['متصلين', 'online'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'online');
