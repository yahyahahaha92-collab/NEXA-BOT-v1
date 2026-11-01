import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { YT_PROXY, MAX_SEND_MB } from './keys.js';

// Downloads the official yt-dlp binary once (into ./bin) and uses it to fetch YouTube audio/video.
const ROOT = process.cwd();
const BIN_DIR = path.join(ROOT, 'bin');
const TMP_DIR = path.join(ROOT, 'tmp');
const BIN = path.join(BIN_DIR, 'yt-dlp');

const ASSETS = process.arch === 'arm64'
  ? ['yt-dlp_linux_aarch64', 'yt-dlp_musllinux_aarch64']
  : ['yt-dlp_linux', 'yt-dlp_musllinux'];

const run = (bin, args, timeout = 240000) => new Promise((resolve, reject) => {
  execFile(bin, args, { timeout, maxBuffer: 20 * 1024 * 1024, cwd: ROOT }, (err, stdout, stderr) => {
    if (err) { err.stderr = String(stderr || ''); err.stdout = String(stdout || ''); return reject(err); }
    resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') });
  });
});

const tail = (s = '', n = 220) => s.replace(/\s+/g, ' ').trim().slice(-n);
// short, readable reason from yt-dlp's output
const reason = (s = '') => {
  const m = String(s).match(/ERROR:[^\n]*/g);
  const line = (m ? m[m.length - 1] : tail(s, 200)).replace(/\s+/g, ' ');
  return line.replace(/Use --cookies-from-browser.*$/i, '(YouTube asks to sign in)').slice(0, 170);
};
const CLIENTS = ['', 'android_vr', 'tv_embedded', 'mweb', 'ios', 'web_safari', 'tv'];
const FATAL = /Video unavailable|Private video|has been removed|copyright|not available in your country|members-only|This live event/i;

let installing = null;
export async function ensureYtdlp(notify) {
  if (fs.existsSync(BIN)) return BIN;
  if (installing) return installing;
  installing = (async () => {
    fs.mkdirSync(BIN_DIR, { recursive: true });
    let lastErr;
    for (const asset of ASSETS) {
      try {
        if (notify) await notify();
        const res = await fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`, { redirect: 'follow', signal: AbortSignal.timeout(240000) });
        if (!res.ok) throw new Error(`download ${asset}: HTTP ${res.status}`);
        const tmp = BIN + '.part';
        fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
        fs.chmodSync(tmp, 0o755);
        await run(tmp, ['--version'], 60000);        // make sure it can run on this server
        fs.renameSync(tmp, BIN);
        console.log('[YTDLP] installed', asset);
        return BIN;
      } catch (e) {
        lastErr = e;
        console.error('[YTDLP] install failed for', asset, e?.message || e, tail(e?.stderr));
        try { fs.rmSync(BIN + '.part', { force: true }); } catch {}
      }
    }
    throw new Error('cannot install yt-dlp: ' + (lastErr?.message || lastErr) + ' ' + tail(lastErr?.stderr, 120));
  })();
  try { return await installing; } finally { installing = null; }
}

// returns { file, title, ext }
export async function ytdlpGet(url, isAudio, notify) {
  const bin = await ensureYtdlp(notify);
  fs.mkdirSync(TMP_DIR, { recursive: true });
  // clean old leftovers
  try { for (const f of fs.readdirSync(TMP_DIR)) { const p = path.join(TMP_DIR, f); if (Date.now() - fs.statSync(p).mtimeMs > 3600000) fs.rmSync(p, { force: true }); } } catch {}

  const id = `${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
  const tpl = path.join(TMP_DIR, `${id}.%(ext)s`);
  const fmt = isAudio
    ? 'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio'
    : 'best[ext=mp4][height<=480]/best[ext=mp4]/best[height<=480]/best';
  const base = ['--no-playlist', '--no-warnings', '--no-progress', '-f', fmt, '--max-filesize', `${MAX_SEND_MB}M`, '--socket-timeout', '20',
    '--no-simulate', '--print', '%(title)s', '-o', tpl];

  const cookies = ['cookies.txt', 'system/cookies.txt'].map(p => path.join(ROOT, p)).find(p => fs.existsSync(p));
  if (cookies) base.push('--cookies', cookies);

  if (YT_PROXY) base.push('--proxy', YT_PROXY);

  // try several YouTube "clients": some of them are not blocked on hosting IPs
  const attempts = [];
  let out = null;
  for (const client of CLIENTS) {
    const args = [...base];
    if (client) args.push('--extractor-args', `youtube:player_client=${client}`);
    try {
      try {
        out = await run(bin, [...args, '--js-runtimes', 'node', url], 120000);
      } catch (e) {
        if (/no such option|unrecognized arguments|unknown option|js-runtimes/i.test(e.stderr || '')) out = await run(bin, [...args, url], 120000);
        else throw e;
      }
      if (client) console.log('[YTDLP] worked with client', client);
      break;
    } catch (e) {
      const why = reason(e.stderr || e.message);
      attempts.push(`${client || 'default'}: ${why}`);
      console.error('[YTDLP] attempt failed:', client || 'default', why);
      if (FATAL.test(e.stderr || '')) break;
    }
  }
  if (!out) {
    const err = new Error(attempts.slice(0, 3).join(' | '));
    err.attempts = attempts;
    throw err;
  }

  const file = fs.readdirSync(TMP_DIR).map(f => path.join(TMP_DIR, f)).find(p => path.basename(p).startsWith(id + '.') && !p.endsWith('.part'));
  if (!file) throw new Error('yt-dlp finished but no file was produced: ' + tail(out.stderr));
  return { file, title: (out.stdout.split('\n')[0] || '').trim(), ext: path.extname(file).slice(1).toLowerCase() };
}

// Fallback for songs when YouTube blocks the server: search + download from SoundCloud
export async function soundcloudGet(query, notify) {
  const bin = await ensureYtdlp(notify);
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const id = `sc-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
  const tpl = path.join(TMP_DIR, `${id}.%(ext)s`);
  const args = ['--no-playlist', '--no-warnings', '--no-progress', '-f', 'bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio',
    '--max-filesize', `${MAX_SEND_MB}M`, '--socket-timeout', '20', '--no-simulate', '--print', '%(title)s|||%(uploader)s|||%(duration_string)s',
    '-o', tpl, `scsearch1:${query}`];
  if (YT_PROXY) args.push('--proxy', YT_PROXY);
  let out;
  try { out = await run(bin, args, 120000); }
  catch (e) { throw new Error(reason(e.stderr || e.message)); }
  const file = fs.readdirSync(TMP_DIR).map(f => path.join(TMP_DIR, f)).find(p => path.basename(p).startsWith(id + '.') && !p.endsWith('.part'));
  if (!file) throw new Error('soundcloud: no result for this name');
  const [title, uploader, duration] = (out.stdout.split('\n')[0] || '').split('|||');
  return { file, title: (title || '').trim(), uploader: (uploader || '').trim(), duration: (duration || '').trim(), ext: path.extname(file).slice(1).toLowerCase() };
}
