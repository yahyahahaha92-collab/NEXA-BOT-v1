import { POLLINATIONS_KEY } from '../../system/keys.js';
import { fetchT } from '../../system/dl.js';

const IMAGE_MODEL = 'flux';
const VIDEO_MODEL = 'seedance';   // alternative: 'veo'
const BASE = 'https://gen.pollinations.ai/image';

const build = (prompt, params) => {
  const q = new URLSearchParams(params);
  if (POLLINATIONS_KEY) q.set('key', POLLINATIONS_KEY);
  return `${BASE}/${encodeURIComponent(prompt)}?${q.toString()}`;
};

// .تخيل <وصف>  -> image   |   .توليد <وصف> -> short video (5 seconds or less)
const handler = async (m, { conn, text, command }) => {
  if (!text) throw `*❲ 🎨 ❳ اكتب وصف جنب الأمر*\nمثال: .${command} قطة فضائية تلبس نظارة`;
  const isVideo = ['توليد', 'video_ai'].includes(command);

  await m.react('⏳');
  await m.reply(isVideo ? '*🎬 جاري توليد الفيديو (قد يأخذ دقيقة أو اثنتين)...*' : '*🎨 جاري رسم الصورة...*');

  const url = isVideo
    ? build(text, { model: VIDEO_MODEL, duration: 5, aspectRatio: '16:9' })
    : build(text, { model: IMAGE_MODEL, width: 1024, height: 1024, nologo: true, seed: Math.floor(Math.random() * 1e6) });

  let res;
  try {
    res = await fetchT(url, {}, isVideo ? 240000 : 90000);
  } catch (e) {
    console.error('[IMAGINE] request failed:', e?.message || e);
    throw '❌ خدمة التوليد مش بترد دلوقتي، جرب بعد شويه';
  }

  const type = res.headers.get('content-type') || '';
  if (!res.ok || !(type.startsWith('image/') || type.startsWith('video/'))) {
    const body = (await res.text().catch(() => '')).slice(0, 300);
    console.error('[IMAGINE] bad response:', res.status, type, body);
    if (res.status === 401 || res.status === 402 || res.status === 403) {
      throw `❌ ${isVideo ? 'توليد الفيديو' : 'هذا النموذج'} يحتاج مفتاح (أو رصيد) من enter.pollinations.ai\nضع المفتاح في الملف: system/keys.js`;
    }
    throw '❌ فشل التوليد، جرب وصفاً مختلفاً أو بعد شويه';
  }

  const buf = Buffer.from(await res.arrayBuffer());
  try {
    if (type.startsWith('video/')) {
      await conn.sendMessage(m.chat, { video: buf, mimetype: 'video/mp4', caption: `*🎬 ${text}*` }, { quoted: m });
    } else {
      await conn.sendMessage(m.chat, { image: buf, caption: `*🎨 ${text}*` }, { quoted: m });
    }
    await m.react('✅');
  } catch (e) {
    console.error('[IMAGINE] send failed:', e?.stack || e);
    throw '❌ تعذر إرسال النتيجة، جرب مرة ثانية';
  }
};

handler.usage = ['تخيل', 'توليد'];
handler.category = 'ai';
handler.command = ['تخيل', 'imagine', 'توليد', 'video_ai'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'imagine');
