import { sendYoutube } from '../../system/ytget.js';

// .songdl <videoId>  (used by the list of .اغنيه)
const handler = async (m, { conn, text }) => {
  const id = (text || '').trim();
  if (!/^[\w-]{11}$/.test(id)) throw '❌ معرف الأغنية غير صحيح، ابحث من جديد بـ .اغنيه';
  const meta = global.songCache?.get(id) || null;
  await sendYoutube(m, conn, `https://www.youtube.com/watch?v=${id}`, true, meta);
};

handler.command = ["songdl"];

import { safe } from '../../system/safe.js';
export default safe(handler, 'songdl');
