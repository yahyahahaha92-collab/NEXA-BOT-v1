import { extractUrl } from '../../system/dl.js';

const insta = async (m, { text, Api, conn }) => {
  const url = extractUrl(text) || extractUrl(m.quoted?.text || '');
  if (!url) throw '❌ حط رابط انستا جنب الأمر\nمثال: .انستا https://www.instagram.com/reel/xxxx';
  if (!/instagram\.com\//i.test(url)) throw '❌ هذا مش رابط انستجرام';

  await m.react('⏳');

  let result;
  for (let i = 0; i < 2; i++) {
    try {
      result = await Api.download.instagram({ url });
      if (result?.status === 'success' && result.data) break;
      console.error('[IG] attempt', i + 1, 'status:', result?.status, JSON.stringify(result || {}).slice(0, 200));
    } catch (e) {
      console.error('[IG] attempt', i + 1, 'error:', e?.message || e);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  if (!result || result.status !== 'success' || !result.data) {
    throw '❌ ما قدرت أجيب المحتوى.\nتأكد أن الحساب عام (مش خاص) وأن الرابط صحيح، وجرب بعد شويه';
  }

  const items = Array.isArray(result.data) ? result.data : [result.data];
  const videos = items.filter(i => i.type === 'video' && i.url);
  const images = items.filter(i => (i.type === 'image' || i.type === 'photo') && i.url);
  const thumb = items.find(i => i.type === 'thumbnail' && i.url);

  try {
    if (videos.length) {
      if (thumb) await conn.sendMessage(m.chat, { image: { url: thumb.url }, caption: '```Instagram preview```' }, { quoted: m });
      for (const v of videos.slice(0, 5)) {
        await conn.sendMessage(m.chat, { video: { url: v.url }, caption: '```📥 Instagram```' }, { quoted: m });
      }
    } else if (images.length) {
      for (const img of images.slice(0, 10)) {
        await conn.sendMessage(m.chat, { image: { url: img.url }, caption: '```📥 Instagram```' }, { quoted: m });
      }
    } else if (thumb) {
      await conn.sendMessage(m.chat, { image: { url: thumb.url }, caption: '```📥 Instagram```' }, { quoted: m });
    } else {
      throw '❌ ما لقيت فيديو أو صور في هذا المنشور';
    }
    await m.react('✅');
  } catch (e) {
    if (typeof e === 'string') throw e;
    console.error('[IG] send failed:', e?.stack || e);
    throw '❌ تعذر إرسال الملف، جرب مرة ثانية';
  }
};
insta.usage = ["انستا"];
insta.category = "downloads";
insta.command = ["انستا", "instagram", "ig"];
insta.admin = false;
import { safe } from '../../system/safe.js';
export default safe(insta, 'Instagram');
