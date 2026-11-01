import { sendYoutube } from '../../system/ytget.js';
import { extractUrl, ytSearch } from '../../system/dl.js';

const NEWSLETTER = { name: '𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️', jid: '120363428637387322@newsletter' };
const cut = (s = '', n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const vid = (u = '') => (u.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/) || [])[1] || '';
global.songCache ||= new Map();

// .اغنيه <name>  -> a list of 4 songs to choose from   |   .اغنيه <link> -> downloads directly
// .فيديو <name or link> -> downloads the video directly
const handler = async (m, { conn, text, command }) => {
  const isSong = ['اغنيه', 'اغنية', 'play'].includes(command);
  text = (text || '').trim();

  if (!isSong || extractUrl(text)) return sendYoutube(m, conn, text, isSong);
  if (!text) throw '*❲ ❤️ ❳ ~ اكتب اسم الأغنية جنب الأمر ~ ❲ 💙 ❳*\nمثال: .اغنيه funk mandala';

  await m.react('🔎');
  const results = await ytSearch(text, 4);
  if (!results.length) throw `❌ ما لقيت نتائج لـ "${text}"، جرب كلمات تانية`;

  for (const r of results) { r.id = vid(r.url); global.songCache.set(r.id, r); }

  const caption =
    `*🎵 نتائج البحث عن:* ${text}\n\n` +
    results.map((r, i) => `*${i + 1}.* ${cut(r.title, 60)}\n    ⏳ ${r.duration || '-'} • 📢 ${cut(r.channel, 24)}`).join('\n\n') +
    `\n\n> اضغط الزر واختر الأغنية للتحميل`;

  const sections = [{
    title: '🎵 الأغاني',
    rows: results.map((r, i) => ({
      title: cut(`${i + 1}. ${r.title}`, 24),
      description: cut(`${r.duration || '-'} • ${r.channel}`, 72),
      id: `.songdl ${r.id}`
    }))
  }];

  try {
    await conn.sendButtonNormal(m.chat, {
      media: { url: results[0].image || global.IMG.menu },
      mediaType: 'image',
      caption,
      buttons: [{ name: 'single_select', params: { title: '🎵 اختر الأغنية', sections } }],
      mentions: [m.sender],
      newsletter: NEWSLETTER
    }, m);
  } catch (e) {
    console.error('[SONG] list message failed, sending text list:', e?.message || e);
    await m.reply(caption.replace('> اضغط الزر واختر الأغنية للتحميل', '> للتحميل اكتب الأمر:') + '\n\n' + results.map((r, i) => `${i + 1}. .songdl ${r.id}`).join('\n'));
  }
};

handler.usage = ["اغنيه", "فيديو"];
handler.category = "downloads";
handler.command = ["اغنيه", "فيديو", "اغنية", "play", "video"];

import { safe } from '../../system/safe.js';
export default safe(handler, 'yt-button');
