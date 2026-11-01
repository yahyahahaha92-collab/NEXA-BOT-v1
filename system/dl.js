// Shared helpers for download commands
export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// WhatsApp uploads need temp disk/RAM on the host: files above this are sent as a link instead
import { MAX_SEND_MB } from './keys.js';
export const MAX_SEND_BYTES = MAX_SEND_MB * 1024 * 1024;

export const fetchT = (url, opts = {}, ms = 30000) => fetch(url, { ...opts, signal: AbortSignal.timeout(ms) });

export const extractUrl = (text = '') => {
  const m = String(text).match(/https?:\/\/[^\s<>"'`]+/i);
  return m ? m[0].replace(/[)\]}.,!؟،;]+$/, '') : '';
};

export const retry = async (fn, tries = 2, delay = 1500) => {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(i); } catch (e) { last = e; if (i < tries - 1) await new Promise(r => setTimeout(r, delay)); }
  }
  throw last;
};

export const fmtSize = (bytes = 0) => {
  if (!bytes) return '-';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let n = Number(bytes);
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
};

export const YT_RE = /(youtube\.com\/(watch\?|shorts\/|live\/)|youtu\.be\/|music\.youtube\.com\/)/i;

// ---------- YouTube search by name (tries several sources) ----------
const fromYoutube = async (q, limit) => {
  const res = await fetchT(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en&gl=US`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' }
  }, 20000);
  const html = await res.text();
  const mm = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
  if (!mm) throw new Error('ytInitialData not found');
  const data = JSON.parse(mm[1]);
  const out = [];
  const walk = (o) => {
    if (!o || typeof o !== 'object' || out.length >= limit) return;
    const v = o.videoRenderer;
    if (v?.videoId) {
      out.push({
        title: v.title?.runs?.[0]?.text || '',
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        image: v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        duration: v.lengthText?.simpleText || '',
        channel: v.ownerText?.runs?.[0]?.text || ''
      });
      return;
    }
    for (const k in o) walk(o[k]);
  };
  walk(data);
  return out;
};

const fromInvidious = async (q, limit) => {
  const hosts = ['https://yewtu.be', 'https://inv.nadeko.net', 'https://invidious.nerdvpn.de'];
  let lastErr;
  for (const h of hosts) {
    try {
      const res = await fetchT(`${h}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, { headers: { 'User-Agent': UA } }, 12000);
      const list = await res.json();
      if (Array.isArray(list) && list.length) {
        return list.slice(0, limit).map(v => ({
          title: v.title, url: `https://www.youtube.com/watch?v=${v.videoId}`,
          image: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          duration: v.lengthSeconds ? `${Math.floor(v.lengthSeconds / 60)}:${String(v.lengthSeconds % 60).padStart(2, '0')}` : '',
          channel: v.author || ''
        }));
      }
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('invidious: no result');
};

const fromEmam = async (q, limit) => {
  const res = await fetchT(`https://emam-api.web.id/home/sections/Search/api/YouTube/search?q=${encodeURIComponent(q)}`, {}, 15000);
  const { data } = await res.json();
  return (data || []).slice(0, limit).map(v => ({ title: v.title, url: v.url, image: v.image, duration: v.timestamp, channel: v.author?.name || '' }));
};

export async function ytSearch(q, limit = 5) {
  for (const [name, fn] of [['youtube', fromYoutube], ['invidious', fromInvidious], ['emam', fromEmam]]) {
    try {
      const r = await fn(q, limit);
      if (r?.length) return r;
    } catch (e) { console.error(`[ytSearch:${name}]`, e?.message || e); }
  }
  return [];
}
