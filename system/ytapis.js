import { createRequire } from 'module';
import { fetchT, UA } from './dl.js';

// Same idea used by Madara/GataBot: the conversion happens on OTHER servers,
// so it works even when YouTube blocks the hosting IP of this bot.
const enc = encodeURIComponent;
const timeout = (ms, msg) => new Promise((_, rej) => setTimeout(() => rej(new Error(msg || 'timeout')), ms));

const BAD_KEY = /thumb|image|cover|poster|avatar|icon|banner/i;
const GOOD_KEY = /download|dl|url|link|src|file|mp3|mp4|audio|video/i;
const findLink = (obj) => {
  let best = '';
  const walk = (o, key = '') => {
    if (best || o == null) return;
    if (typeof o === 'string') { if (/^https?:\/\//i.test(o) && !BAD_KEY.test(key) && (GOOD_KEY.test(key) || !key)) best = o; return; }
    if (Array.isArray(o)) { o.forEach(x => walk(x, key)); return; }
    if (typeof o === 'object') {
      for (const k of Object.keys(o)) if (GOOD_KEY.test(k) && !BAD_KEY.test(k)) walk(o[k], k);
      for (const k of Object.keys(o)) if (!(GOOD_KEY.test(k) && !BAD_KEY.test(k))) walk(o[k], k);
    }
  };
  walk(obj);
  return best;
};
const findTitle = (o) => o?.title || o?.result?.title || o?.data?.title || o?.metadata?.title || '';

const verify = async (url, isAudio) => {
  const tryReq = async (opts) => {
    const r = await fetchT(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) } }, 20000);
    const type = (r.headers.get('content-type') || '').toLowerCase();
    const ok = (r.ok || r.status === 206) && /audio|video|octet-stream/.test(type);
    try { await r.body?.cancel(); } catch {}
    return ok ? type.split(';')[0] : '';
  };
  try { return (await tryReq({ method: 'HEAD' })) || (await tryReq({ headers: { Range: 'bytes=0-1' } })); }
  catch { try { return await tryReq({ headers: { Range: 'bytes=0-1' } }); } catch { return ''; } }
};

// 1) npm package used by GataBot: @hiudyy/ytdl  (installed from package.json)
async function viaHiudyy(url, isAudio) {
  const name = isAudio ? 'ytmp3' : 'ytmp4';
  const cands = [];
  try { const mod = await import('@hiudyy/ytdl'); cands.push(mod, mod?.default, mod?.default?.default); } catch (e) { console.error('[YT] import @hiudyy/ytdl:', e?.message || e); }
  try { const c = createRequire(process.cwd() + '/')('@hiudyy/ytdl'); cands.push(c, c?.default); } catch (e) { console.error('[YT] require @hiudyy/ytdl:', e?.message || e); }
  const holder = cands.find(c => c && typeof c[name] === 'function');
  if (!holder) {
    const keys = [...new Set(cands.filter(Boolean).flatMap(c => { try { return Object.keys(c); } catch { return []; } }))].slice(0, 12).join(',');
    throw new Error(cands.length ? `function ${name} not found; exports: [${keys}]` : 'package not installed (restart the server so it installs)');
  }
  const fn = holder[name].bind(holder);
  const r = await Promise.race([fn(url), timeout(75000, '@hiudyy/ytdl timeout')]);
  if (Buffer.isBuffer(r)) return { buffer: r };
  if (typeof r === 'string' && /^https?:\/\//i.test(r)) return { url: r };
  if (Buffer.isBuffer(r?.buffer)) return { buffer: r.buffer, title: r.title };
  const link = findLink(r);
  if (link) return { url: link, title: findTitle(r) };
  throw new Error('@hiudyy/ytdl: unexpected result ' + JSON.stringify(r || {}).slice(0, 100));
}

// 2) public APIs (tried at the same time, first valid one wins)
const AUDIO_APIS = [
  (u) => `https://api.zenkey.my.id/api/download/ytmp3?url=${enc(u)}`,
  (u) => `https://api.siputzx.my.id/api/d/ytmp4?url=${enc(u)}`,
  (u) => `https://exonity.tech/api/ytdlp2-faster?url=${enc(u)}`
];
const VIDEO_APIS = [
  (u) => `https://api.siputzx.my.id/api/d/ytmp4?url=${enc(u)}`,
  (u) => `https://exonity.tech/api/ytdlp2-faster?url=${enc(u)}`,
  (u) => `https://api.zenkey.my.id/api/download/ytmp4?url=${enc(u)}`
];

async function viaApi(make, url, isAudio, debug) {
  const api = make(url);
  const host = new URL(api).hostname;
  try {
    const res = await fetchT(api, { headers: { 'User-Agent': UA } }, 40000);
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = null; }
    const link = json ? findLink(json) : '';
    if (!link) throw new Error(`HTTP ${res.status} ${text.slice(0, 70).replace(/\s+/g, ' ')}`);
    const mime = await verify(link, isAudio);
    if (!mime) throw new Error('الرابط ليس ملف وسائط');
    return { url: link, title: findTitle(json), mime, via: host };
  } catch (e) {
    console.error(`[YT:${host}]`, e?.message || e);
    debug.push(`${host}: ${e?.message || e}`);
    throw e;
  }
}

// returns { url | buffer, title, mime, via } or null
export async function externalGet(url, isAudio, debug = []) {
  try {
    const r = await viaHiudyy(url, isAudio);
    console.log('[YT] OK via @hiudyy/ytdl');
    return { ...r, via: '@hiudyy/ytdl' };
  } catch (e) {
    console.error('[YT] @hiudyy/ytdl failed:', e?.message || e);
    debug.push('@hiudyy/ytdl: ' + String(e?.message || e).slice(0, 120));
  }
  try {
    const r = await Promise.any((isAudio ? AUDIO_APIS : VIDEO_APIS).map(make => viaApi(make, url, isAudio, debug)));
    console.log('[YT] OK via', r.via);
    return r;
  } catch { return null; }
}
