import axios from 'axios';
import qs from 'qs';
import cheerio from 'cheerio';
import { extractUrl } from '../../system/dl.js';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*❲ ❤️ ❳ ~ ضع رابط الفيديو بعد الأمر ~ ❲ 💙 ❳ *\n\nمثال:\n/${command} https://www.facebook.com/reel/xxxxxx`;

  const link = extractUrl(text) || extractUrl(m.quoted?.text || '');
  if (!link || !/facebook\.com|fb\.watch|fb\.com/i.test(link)) throw '❌ حط رابط فيسبوك صحيح';

  m.react('🌾');

  try {
    const tokenRes = await userVerify(link);
    const htmlRes = await ajaxSearch(link, tokenRes.k_token, tokenRes.k_exp, tokenRes.token);
    const $ = cheerio.load(htmlRes.data);

    const title = $('.detail h3').text().trim() || 'Facebook Video';
    const duration = $('.detail p').first().text().trim() || '';
    const thumb = $('.detail .thumbnail img').attr('src') || '';
    const downloads = [];

    $('table.table tbody tr').each((_, el) => {
      const quality = $(el).find('.video-quality').text().trim();
      const url = $(el).find('a.download-link-fb').attr('href');
      if (quality && url) downloads.push({ quality, url });
    });

    if (!downloads.length) throw '❌ لا يوجد فيديو متاح للتحميل';

    const caption = `> *تم بواسطة ~ ${m.pushName}*`;

    await conn.sendMessage(m.chat, {
      video: { url: downloads[0].url },
      caption
    }, { quoted: m });

  } catch (e) {
    console.error('[FB]', e?.message || e);
    m.react('❌');
    return m.reply(typeof e === 'string' ? e : '❌ ما قدرت أحمّل الفيديو.\nتأكد أن الفيديو عام وأن الرابط صحيح، أو جرب بعد شويه');
  }
};

handler.usage = ["فيس"]
handler.category = "downloads";
handler.command = /^(فيس|فيسبوك|fb|fbdl|facebook)$/i;

import { safe } from '../../system/safe.js';
export default safe(handler, 'fb');

async function userVerify(url) {
  const data = qs.stringify({ url });
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
    'Referer': 'https://fdownloader.net/id'
  };
  const res = await axios.post('https://fdownloader.net/api/userverify', data, { headers });
  return res.data;
}

async function ajaxSearch(query, token, exp, cftoken) {
  const data = qs.stringify({
    k_exp: exp,
    k_token: token,
    q: query,
    lang: 'id',
    web: 'fdownloader.net',
    v: 'v2',
    w: '',
    cftoken
  });

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
    'Referer': 'https://fdownloader.net/id'
  };

  const res = await axios.post('https://v3.fdownloader.net/api/ajaxSearch', data, { headers });
  return res.data;
}