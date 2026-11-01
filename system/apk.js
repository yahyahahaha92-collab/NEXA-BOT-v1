import { fetchT, fmtSize } from './dl.js';

const API = 'https://ws75.aptoide.com/api/7/apps/search';
global.apkCache ||= new Map();

const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff ]+/g, ' ').replace(/\s+/g, ' ').trim();
export const short = (n = 0) => (n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n || 0));
const fmtDate = (d) => { try { return d ? new Date(d.replace(' ', 'T') + 'Z').toISOString().slice(0, 10) : '-'; } catch { return String(d || '-').slice(0, 10); } };

const toApp = (x) => ({
  name: x.name,
  pkg: x.package,
  icon: x.icon || x.graphic,
  graphic: x.graphic,
  link: x.file?.path || x.file?.path_alt,
  size: x.size || x.file?.filesize || 0,
  ver: x.file?.vername || '',
  rating: Number(x.stats?.rating?.avg) || 0,
  votes: Number(x.stats?.rating?.total) || 0,
  downloads: Number(x.stats?.downloads || x.stats?.pdownloads) || 0,
  updated: x.updated || x.modified || x.added || '',
  store: x.store?.name || '',
  malware: String(x.file?.malware?.rank || '').toUpperCase(),
  hasObb: !!(x.obb && (x.obb.main || x.obb.patch)),
  minSdk: x.file?.hardware?.sdk || ''
});

// relevance score: exact name / package match first, then prefix, then word overlap, then popularity + quality
const score = (a, q) => {
  const n = norm(a.name), nq = norm(q);
  let s = 0;
  if (a.pkg && a.pkg.toLowerCase() === q.trim().toLowerCase()) s += 200;
  if (n === nq) s += 100;
  else if (n.startsWith(nq)) s += 70;
  else if (n.includes(nq)) s += 50;
  const words = nq.split(' ').filter(Boolean);
  if (words.length) s += (words.filter(w => n.includes(w)).length / words.length) * 30;
  s += Math.log10(a.downloads + 1) * 5 + a.rating * 2;
  if (a.malware === 'TRUSTED') s += 5;
  if (a.malware === 'WARN') s -= 30;
  return s;
};

export async function searchApps(q, limit = 8) {
  const urls = [
    `${API}/query=${encodeURIComponent(q)}/limit=25`,
    `${API}?query=${encodeURIComponent(q)}&limit=25`
  ];
  for (const url of urls) {
    try {
      const res = await fetchT(url, {}, 30000);
      const data = await res.json();
      const seen = new Set();
      const list = (data?.datalist?.list || [])
        .map(toApp)
        .filter(a => a.link && a.pkg && !seen.has(a.pkg) && seen.add(a.pkg))
        .map(a => ({ ...a, _s: score(a, q) }))
        .sort((x, y) => y._s - x._s)
        .slice(0, limit);
      if (list.length) {
        for (const a of list) global.apkCache.set(a.pkg, a);
        return list;
      }
      console.error('[APK] no results from', url, JSON.stringify(data).slice(0, 200));
    } catch (e) {
      console.error('[APK] request failed:', url, e?.message || e);
    }
  }
  return [];
}

const shield = (r) => (r === 'TRUSTED' ? '🛡️ موثوق' : r === 'WARN' ? '⚠️ تحذير' : r === 'UNKNOWN' || !r ? '❔ غير مفحوص' : `🛡️ ${r}`);

export const appCard = (a, withHint = true) =>
  `*📦 ${a.name}*\n` +
  `${'─'.repeat(14)}\n` +
  `*⭐ التقييم:* ${a.rating ? a.rating.toFixed(1) + ` (${short(a.votes)} صوت)` : '-'}\n` +
  `*⬇️ التحميلات:* ${short(a.downloads)}\n` +
  `*🏷️ الإصدار:* ${a.ver || '-'}\n` +
  `*📦 الحجم:* ${fmtSize(a.size)}\n` +
  `*🗓️ آخر تحديث:* ${fmtDate(a.updated)}\n` +
  `*🛡️ الأمان:* ${shield(a.malware)}\n` +
  (a.store ? `*🏪 المتجر:* ${a.store}\n` : '') +
  `*🆔 الحزمة:* ${a.pkg}\n` +
  (a.hasObb ? `\n> 🎮 _هذه اللعبة قد تحتاج ملفات OBB إضافية لتعمل بعد التثبيت_\n` : '') +
  (withHint ? `\n> للتحميل اختر من القائمة أو اكتب:\n> .apkdl ${a.pkg}` : '');
