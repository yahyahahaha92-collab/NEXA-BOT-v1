import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// .تحديث        -> download the latest version from GitHub and apply it, then restart
// .فحص_تحديث    -> only check what would change
const REPO = 'yahyahahaha92-collab/NEXA-BOT-v1';
const BRANCH = 'main';
const ROOT = process.cwd();
const SKIP = [/^node_modules\//, /^session\//, /^backup\//, /^bin\//, /^tmp\//, /^cookies\.txt$/, /^system\/database\.json$/, /^system\/maingroup\.json$/, /^\.env$/, /^package-lock\.json$/, /^\.git/, /^\.github\//];
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex');

const handler = async (m, { conn, bot, command }) => {
  const checkOnly = command === 'فحص_تحديث';
  await m.reply(checkOnly ? '*🔎 أفحص التحديثات على GitHub...*' : '*⬇️ جاري تنزيل آخر نسخة من GitHub...*');

  let AdmZip;
  try { AdmZip = (await import('adm-zip')).default; }
  catch { throw '❌ مكتبة التحديث (adm-zip) لم تُثبّت بعد.\nاضغط Restart من لوحة الاستضافة وانتظر دقيقة ثم جرب مرة ثانية'; }

  let res;
  try { res = await fetch(`https://codeload.github.com/${REPO}/zip/refs/heads/${BRANCH}`, { signal: AbortSignal.timeout(90000) }); }
  catch (e) { console.error('[UPDATE] download failed:', e?.message || e); throw '❌ تعذر الاتصال بـ GitHub، جرب بعد شويه'; }
  if (!res.ok) throw `❌ فشل تنزيل التحديث (HTTP ${res.status}). تأكد أن المستودع عام وفيه ملفات`;

  const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const changed = [], added = [];

  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    const rel = e.entryName.split('/').slice(1).join('/');
    if (!rel || SKIP.some(r => r.test(rel))) continue;
    const dest = path.resolve(ROOT, rel);
    if (!dest.startsWith(ROOT + path.sep)) continue;

    const data = e.getData();
    const exists = fs.existsSync(dest);
    if (exists) {
      const old = fs.readFileSync(dest);
      if (sha(old) === sha(data)) continue;
      changed.push(rel);
      if (!checkOnly) {
        const bk = path.resolve(ROOT, 'backup', stamp, rel);
        fs.mkdirSync(path.dirname(bk), { recursive: true });
        fs.writeFileSync(bk, old);
      }
    } else added.push(rel);

    if (!checkOnly) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, data);
    }
  }

  const total = changed.length + added.length;
  if (!total) return m.reply('*✅ البوت محدّث، لا توجد ملفات جديدة*');

  const preview = [...changed, ...added].slice(0, 12).map(f => `• ${f}`).join('\n');
  const more = total > 12 ? `\n… و${total - 12} ملف آخر` : '';
  if (checkOnly) {
    return m.reply(`*🆕 يوجد تحديث*\n\nتعديل: ${changed.length} | جديد: ${added.length}\n\n${preview}${more}\n\nاكتب .تحديث لتطبيقه`);
  }

  await m.reply(`*✅ تم التحديث*\n\nتعديل: ${changed.length} | جديد: ${added.length}\n\n${preview}${more}\n\n_نسخة احتياطية للملفات القديمة في المجلد backup_\n_البوت سيعيد التشغيل الآن..._`);
  setTimeout(() => { try { bot.restart(); } catch { process.exit(1); } }, 2500);
};

handler.owner = true;
handler.usage = ['تحديث', 'فحص_تحديث'];
handler.category = 'owner';
handler.command = ['تحديث', 'update', 'فحص_تحديث'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'update');
