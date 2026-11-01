import fs from 'fs';
import { Scrapy } from 'meowsab';
import { extractUrl, ytSearch, retry, YT_RE, MAX_SEND_BYTES, fmtSize } from './dl.js';
import { ytdlpGet, soundcloudGet } from './ytdlp.js';
import { externalGet } from './ytapis.js';

const AUDIO_MIME = { m4a: 'audio/mp4', mp4: 'audio/mp4', mp3: 'audio/mpeg', webm: 'audio/webm', opus: 'audio/ogg; codecs=opus', ogg: 'audio/ogg' };

// input can be a YouTube link OR a name. Sends audio (isAudio) or video.
export async function sendYoutube(m, conn, input, isAudio, metaIn = null) {
  input = (input || '').trim();
  if (!input) throw '*❲ ❤️ ❳ ~ اكتب اسم الأغنية أو حط رابط يوتيوب جنب الأمر ~ ❲ 💙 ❳*';

  let url = extractUrl(input);
  let meta = metaIn || null;
  if (url) {
    if (!YT_RE.test(url)) throw '*❌ ~ الرابط مش يوتيوب ~ حط رابط يوتيوب صحيح أو اكتب اسم*';
  } else {
    await m.react('🔎');
    const results = await ytSearch(input, 1);
    if (!results.length) throw `❌ ما لقيت نتيجة لـ "${input}"، جرب كلمات تانية أو حط الرابط`;
    meta = results[0];
    url = meta.url;
  }

  await m.react('⏳');
  const debug = [];
  let media = null;   // { file | url, title, ext }

  // 0) external converters (the method used by Madara/GataBot): works even if YouTube blocks this server
  try {
    const ext = await externalGet(url, isAudio, debug);
    if (ext) media = { url: ext.url, buffer: ext.buffer, title: ext.title, mime: ext.mime, ext: isAudio ? 'mp3' : 'mp4' };
  } catch (e) { debug.push('external: ' + (e?.message || e)); }

  const blocked = !!media || (global.ytBlockedUntil && Date.now() < global.ytBlockedUntil);

  // 1) yt-dlp (official tool, downloaded automatically the first time)
  if (!media && !(global.ytBlockedUntil && Date.now() < global.ytBlockedUntil)) {
    try {
      const r = await ytdlpGet(url, isAudio, () => m.reply('*⚙️ أجهّز أداة التحميل لأول مرة، قد يأخذ دقيقة...*'));
      media = { file: r.file, title: r.title, ext: r.ext };
    } catch (e) {
      console.error('[YT] yt-dlp failed:', e?.message || e);
      debug.push('yt-dlp: ' + String(e?.message || e).slice(0, 600));
      // YouTube blocks this server: skip YouTube for 30 minutes so the next requests are fast
      if (/sign in/i.test(String(e?.message || ''))) global.ytBlockedUntil = Date.now() + 30 * 60 * 1000;
    }

    // 2) fallback: the library's own scraper
    if (!media && !(global.ytBlockedUntil && Date.now() < global.ytBlockedUntil)) {
      try {
        const res = await retry(() => (isAudio ? Scrapy.ytmp3(url) : Scrapy.ytmp4(url)), 2, 1000);
        if (res?.status && res.downloadUrl) media = { url: res.downloadUrl, title: res.title, channel: res.channel, thumb: res.thumbnail, quality: res.quality, filename: res.filename };
        else debug.push('library: ' + JSON.stringify(res || {}).slice(0, 100));
      } catch (e) {
        console.error('[YT] Scrapy error:', e?.message || e);
        debug.push('library error: ' + (e?.message || e));
      }
    }
  } else if (!media) {
    debug.push('YouTube محجوب على هذا الخادم (تم تخطيه مؤقتاً)');
  }

  // 3) songs only: when YouTube blocks the server, find the same song on SoundCloud
  let source = 'YouTube';
  if (!media && isAudio) {
    let q = meta?.title || '';
    if (!q) {
      try {
        const o = await (await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { signal: AbortSignal.timeout(10000) })).json();
        q = o?.title || '';
      } catch {}
    }
    if (q) {
      try {
        const r = await soundcloudGet(q, () => m.reply('*⚙️ أجهّز أداة التحميل لأول مرة، قد يأخذ دقيقة...*'));
        media = { file: r.file, title: r.title || q, channel: r.uploader, ext: r.ext, duration: r.duration };
        source = 'SoundCloud';
      } catch (e) {
        console.error('[YT] soundcloud fallback failed:', e?.message || e);
        debug.push('soundcloud: ' + String(e?.message || e).slice(0, 160));
      }
    }
  }

  if (!media) {
    let msg = '❌ ما قدرت أحمّل من يوتيوب الآن.\nجرب بعد شويه أو جرب أغنية أخرى.';
    if (m.isOwner && debug.length) msg += '\n\n*🛠️ تشخيص للمطور:*\n' + debug.map(x => '• ' + x).join('\n');
    throw msg;
  }

  const title = media.title || meta?.title || 'YouTube';
  const channel = media.channel || meta?.channel || '';
  const thumb = media.thumb || meta?.image;
  const caption = `*🐞 ${source} | ${isAudio ? 'أغنية' : 'فيديو'} 🐞*\n\n` +
    (source !== 'YouTube' ? `> _يوتيوب يحجب هذا الخادم، فتم جلب الأغنية من ${source}_\n\n` : '') +
    `*❲ 📽️ ❳ العنوان:* ${title}\n` + (channel ? `*❲ 📢 ❳ القناة:* ${channel}\n` : '') +
    ((media.duration || meta?.duration) ? `*❲ ⏳ ❳ المدة:* ${media.duration || meta.duration}\n` : '') +
    (media.quality ? `*❲ 🎚️ ❳ الجودة:* ${media.quality}\n` : '') +
    `\n> _*❲ ⏱️ ❳ الرجاء الانتظار قليلاً...*_`;

  try {
    if (thumb) await conn.sendMessage(m.chat, { image: { url: thumb }, caption }, { quoted: m });
    else await m.reply(caption);
  } catch (e) { console.error('[YT] info message failed:', e?.message || e); }

  try {
    const src = media.buffer ? media.buffer : (media.file ? { url: media.file } : { url: media.url });
    if (media.buffer && media.buffer.length > MAX_SEND_BYTES) throw `❌ الملف كبير (${fmtSize(media.buffer.length)}) ومينفعش يتبعت، جرب مقطع أقصر`;
    if (media.file) {
      const size = fs.statSync(media.file).size;
      if (size > MAX_SEND_BYTES) throw `❌ الملف كبير (${fmtSize(size)}) ومينفعش يتبعت، جرب مقطع أقصر`;
    }
    await conn.sendMessage(m.chat, isAudio
      ? { audio: src, mimetype: (media.mime && media.mime.startsWith('audio') ? media.mime : (AUDIO_MIME[media.ext] || 'audio/mpeg')), fileName: `${title}.${media.ext || 'mp3'}` }
      : { video: src, caption: `*${title}*` }, { quoted: m });
    await m.react('✅');
  } catch (e) {
    if (typeof e === 'string') throw e;
    console.error('[YT] send failed:', e?.stack || e);
    throw '❌ تعذر إرسال الملف (قد يكون كبيراً أو الرابط انتهى)، جرب مرة ثانية';
  } finally {
    if (media.file) { try { fs.rmSync(media.file, { force: true }); } catch {} }
  }
}
