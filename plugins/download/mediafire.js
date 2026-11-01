import cheerio from 'cheerio';
import { extractUrl, fetchT, fmtSize, UA, MAX_SEND_BYTES } from '../../system/dl.js';

const MIME = {
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  apk: 'application/vnd.android.package-archive', pdf: 'application/pdf', mp4: 'video/mp4',
  mkv: 'video/x-matroska', mp3: 'audio/mpeg', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', txt: 'text/plain', json: 'application/json', exe: 'application/x-msdownload'
};

async function parsePage(url) {
  const res = await fetchT(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow' }, 25000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  let link = $('#downloadButton').attr('href') || $('a.input.popsok').attr('href') || '';
  const scrambled = $('#downloadButton').attr('data-scrambled-url');
  if (scrambled) { try { link = Buffer.from(scrambled, 'base64').toString('utf8'); } catch {} }
  if (!/^https?:/i.test(link)) {
    const mm = html.match(/https?:\/\/download[0-9]*\.mediafire\.com\/[^"'\s<>]+/i);
    link = mm ? mm[0] : '';
  }
  if (!link) throw new Error('direct link not found (file removed or protected)');

  const rawName = $('.dl-btn-label').attr('title') || $('.dl-btn-label').first().text() || $('.filename').first().text() || '';
  const name = (rawName || decodeURIComponent(link.split('/').pop().split('?')[0])).trim();
  const btnText = $('#downloadButton').text();
  const sizeText = (btnText.match(/\(([\d.,]+\s*[KMGT]?B)\)/i) || [])[1] || '';
  const image = $('meta[property="og:image"]').attr('content') || '';
  return { link, name, sizeText, image };
}

const handler = async (m, { conn, text, command }) => {
  const url = extractUrl(text) || extractUrl(m.quoted?.text || '');
  if (!url) throw `*❲ 📁 ❳ ~ ضع رابط ميديا فاير بعد الأمر ~ ❲ 🔹 ❳ *\n\nمثال:\n.${command} https://www.mediafire.com/file/xxxxx/file`;
  if (!/mediafire\.com\//i.test(url)) throw '❌ هذا مش رابط ميديا فاير';

  await m.react('📥');

  let info;
  try { info = await parsePage(url); }
  catch (e) {
    console.error('[MEDIAFIRE] parse failed:', e?.message || e);
    throw `❌ ما قدرت أقرأ الملف من ميديا فاير\n(${e?.message || 'خطأ'})\nتأكد أن الرابط صحيح والملف لم يُحذف`;
  }

  // real size (bytes) from the direct link, if available
  let bytes = 0;
  try {
    const head = await fetchT(info.link, { method: 'HEAD', headers: { 'User-Agent': UA } }, 15000);
    bytes = Number(head.headers.get('content-length')) || 0;
  } catch {}

  const ext = (info.name.split('.').pop() || '').toLowerCase();
  const caption = `*📁 MediaFire*\n\n*❲ 📄 ❳ الاسم:* ${info.name}\n*❲ 📦 ❳ الحجم:* ${bytes ? fmtSize(bytes) : (info.sizeText || '-')}\n*❲ 🧩 ❳ النوع:* ${ext || '-'}\n\n> _*❲ ⏱️ ❳ جاري الإرسال...*_`;

  try {
    if (info.image) await conn.sendMessage(m.chat, { image: { url: info.image }, caption }, { quoted: m });
    else await m.reply(caption);
  } catch (e) { console.error('[MEDIAFIRE] info message failed:', e?.message || e); await m.reply(caption); }

  if (bytes && bytes > MAX_SEND_BYTES) {
    return m.reply(`*⚠️ الملف كبير (${fmtSize(bytes)})*\nالسيرفر الحالي لا يستطيع رفع ملفات فوق ${fmtSize(MAX_SEND_BYTES)} على واتساب، فهذا رابط التحميل المباشر:\n\n${info.link}`);
  }

  try {
    await Promise.race([
      conn.sendMessage(m.chat, {
        document: { url: info.link },
        mimetype: MIME[ext] || 'application/octet-stream',
        fileName: info.name,
        caption: `*${info.name}*`
      }, { quoted: m }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout while sending the file')), 240000))
    ]);
    await m.react('✅');
  } catch (e) {
    console.error('[MEDIAFIRE] send failed:', e?.stack || e);
    throw `❌ تعذر إرسال الملف: ${e?.message || 'خطأ'}\nرابط التحميل المباشر:\n${info.link}`;
  }
};

handler.usage = ["ميديافاير"];
handler.category = "downloads";
handler.command = /^(mf|mediafire|ميديافاير)$/i;

import { safe } from '../../system/safe.js';
export default safe(handler, 'mediafire');
