// Decorated messages + buttons (same look as the menu)
const NEWSLETTER = { name: '𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️', jid: '120363428637387322@newsletter' };

export const quick = (text, id) => ({ name: 'quick_reply', params: { display_text: text, id } });
export const link = (text, url) => ({ name: 'cta_url', params: { display_text: text, url } });
export const select = (title, rows, sectionTitle = 'الخيارات') => ({ name: 'single_select', params: { title, sections: [{ title: sectionTitle, rows }] } });

export const box = (emoji, title, body = '', footer = '') =>
  `╭─┈─┈─┈─⟞${emoji}⟝─┈─┈─┈─╮\n┃ *⌯︙ ${title}*\n╰─┈─┈─┈─⟞${emoji}⟝─┈─┈─┈─╯` +
  (body ? `\n\n${body}` : '') + (footer ? `\n\n> _*${footer}*_` : '');

// image + text + buttons in ONE message (falls back to plain text if buttons are not supported)
export async function sendUI(conn, m, { text, image, buttons = [], mentions = [] }) {
  try {
    return await conn.sendButtonNormal(m.chat, {
      media: { url: image || global.IMG.menu },
      mediaType: 'image',
      caption: text,
      buttons,
      mentions,
      newsletter: NEWSLETTER
    }, m);
  } catch (e) {
    console.error('[UI] buttons failed, sending plain text:', e?.message || e);
    return conn.sendMessage(m.chat, { text, mentions }, { quoted: m });
  }
}

// banner of a section (assets/sec_<key>.jpg on GitHub). Falls back to the main menu image if it is not uploaded yet.
const imgCache = new Map();
export async function sectionImage(key) {
  const url = global.IMG.menu.replace(/[^/]+$/, `sec_${key}.jpg`);
  const hit = imgCache.get(url);
  if (hit && Date.now() < hit.until) return hit.ok ? url : global.IMG.menu;
  let ok = false;
  try { const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) }); ok = r.ok; } catch {}
  imgCache.set(url, { ok, until: Date.now() + (ok ? 6 * 3600e3 : 10 * 60e3) });
  return ok ? url : global.IMG.menu;
}
