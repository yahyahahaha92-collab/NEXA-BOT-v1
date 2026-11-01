import crypto from 'crypto';
import cheerio from 'cheerio';
import axios from 'axios';
import qs from 'qs';
import { extractUrl, retry } from '../../system/dl.js';

const ff = async (m, { text, conn }) => {
  const url = extractUrl(text) || extractUrl(m.quoted?.text || '');
  if (!url) throw '❌ حط رابط تيك توك جنب الأمر\nمثال: .تيك https://www.tiktok.com/@user/video/123';
  if (!/tiktok\.com\//i.test(url)) throw '❌ هذا مش رابط تيك توك';

  await m.react('⏳');

  let videoData;
  try {
    videoData = await retry(() => downloadTikTok(url), 2);
  } catch (e) {
    console.error('[TIKTOK] request failed:', e?.message || e);
    throw '❌ خدمة تيك توك مش بترد دلوقتي، جرب بعد شويه';
  }

  if (!videoData?.videoUrl && !videoData?.audioUrl) {
    throw '❌ ما قدرت أحمّل الفيديو.\nقد يكون الفيديو خاص أو محذوف أو الرابط غير صالح';
  }

  try {
    if (videoData.videoUrl) {
      await conn.sendMessage(m.chat, { video: { url: videoData.hdVideo || videoData.videoUrl }, caption: `🟢 ${videoData.description || "TikTok"}` }, { quoted: m });
    }
    if (videoData.audioUrl) {
      await conn.sendMessage(m.chat, { audio: { url: videoData.audioUrl }, mimetype: 'audio/mpeg' }, { quoted: m });
    }
    await m.react('✅');
  } catch (e) {
    console.error('[TIKTOK] send failed:', e?.stack || e);
    throw '❌ تعذر إرسال الملف، جرب مرة ثانية';
  }
};
ff.usage = ["تيك"]
ff.category = "downloads";
ff.command = ["تيك", "tiktok", "tt"];
import { safe } from '../../system/safe.js';
export default safe(ff, 'tiktok');


async function downloadTikTok(url) {

  let data = qs.stringify({
    'id': url,
    'locale': 'en',
    'tt': crypto.randomBytes(8).toString('hex'),
  });

  let config = {
    method: 'POST',
    url: 'https://ssstik.io/abc?url=dl',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  };

  const response = await axios.request(config);
  const $ = cheerio.load(response.data);

  return {
    author: $('h2').first().text().trim(),
    description: $('.maintext').text().trim(),
    videoUrl: $('a[href*="tikcdn.io"]:not(#hd_download)').first().attr('href'),
    audioUrl: $('.download_link.music').attr('href'),
    hdVideo: $('#hd_download').attr('href')
  };
}
