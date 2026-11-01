import { extractUrl, fetchT, fmtSize, MAX_SEND_BYTES } from '../../system/dl.js';

// .جيت <github link>  -> sends the repository as a zip file, or a single file if the link points to one
const handler = async (m, { conn, text }) => {
  const url = extractUrl(text) || extractUrl(m.quoted?.text || '');
  const mm = url.match(/github\.com\/([^\/\s]+)\/([^\/#?\s]+)(?:\/(blob|tree)\/([^\/]+)\/?([^#?]*))?/i);
  if (!mm) throw '❌ حط رابط GitHub صحيح\nمثال:\n.جيت https://github.com/user/repo\n.جيت https://github.com/user/repo/blob/main/file.js';

  let [, user, repo, kind, branch, rest] = mm;
  repo = repo.replace(/\.git$/i, '');
  await m.react('📥');

  // single file
  if (kind === 'blob' && rest) {
    const raw = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${rest}`;
    let res;
    try { res = await fetchT(raw, {}, 30000); } catch { throw '❌ تعذر الاتصال بـ GitHub، جرب بعد شويه'; }
    if (!res.ok) throw `❌ ما لقيت الملف (HTTP ${res.status})`;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_SEND_BYTES) throw `❌ الملف كبير (${fmtSize(buf.length)})، حمّله من:\n${raw}`;
    await conn.sendMessage(m.chat, { document: buf, mimetype: 'application/octet-stream', fileName: rest.split('/').pop() || 'file.txt', caption: `*📄 ${rest}*` }, { quoted: m });
    return m.react('✅');
  }

  // whole repository as zip
  let info;
  try {
    const r = await fetchT(`https://api.github.com/repos/${user}/${repo}`, { headers: { 'User-Agent': 'NEXA-bot', Accept: 'application/vnd.github+json' } }, 15000);
    info = await r.json();
  } catch { throw '❌ تعذر الاتصال بـ GitHub، جرب بعد شويه'; }
  if (!info || info.message || !info.full_name) throw '❌ ما لقيت المستودع، تأكد أن الرابط صحيح وأنه عام (Public)';

  const br = kind === 'tree' && branch ? branch : (info.default_branch || 'main');
  const bytes = (info.size || 0) * 1024;
  const zipUrl = `https://codeload.github.com/${user}/${repo}/zip/refs/heads/${br}`;

  const caption = `*🐙 GitHub*\n\n*❲ 📦 ❳ المستودع:* ${info.full_name}\n*❲ 📝 ❳ الوصف:* ${info.description || '-'}\n*❲ 💻 ❳ اللغة:* ${info.language || '-'}\n*❲ ⭐ ❳ النجوم:* ${info.stargazers_count}\n*❲ 🌿 ❳ الفرع:* ${br}\n*❲ 📦 ❳ الحجم التقريبي:* ${fmtSize(bytes)}`;
  await m.reply(caption);

  if (bytes > MAX_SEND_BYTES * 2) return m.reply(`*⚠️ المستودع كبير*، حمّله من هنا:\n${zipUrl}`);

  try {
    await conn.sendMessage(m.chat, { document: { url: zipUrl }, mimetype: 'application/zip', fileName: `${repo}-${br}.zip` }, { quoted: m });
    await m.react('✅');
  } catch (e) {
    console.error('[GITHUB] send failed:', e?.stack || e);
    throw `❌ تعذر إرسال الملف، حمّله من هنا:\n${zipUrl}`;
  }
};

handler.usage = ["جيت"];
handler.category = "downloads";
handler.command = ["جيت", "gitclone", "github"];

import { safe } from '../../system/safe.js';
export default safe(handler, 'github');
