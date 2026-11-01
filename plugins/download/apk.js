import { searchApps, appCard, short } from '../../system/apk.js';
import { fmtSize } from '../../system/dl.js';

const NEWSLETTER = { name: '𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️', jid: '120363428637387322@newsletter' };
const cut = (s = '', n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// .apk <name or package>  -> ONE message: top result card + a list of the best matches to choose from
const handler = async (m, { conn, text }) => {
  if (!text) throw '*❲ ❤️ ❳ ~ اكتب اسم التطبيق أو اللعبة جنب الأمر ~*\nمثال: .apk Minecraft\nأو باسم الحزمة: .apk com.whatsapp';

  await m.react('🔎');
  const apps = await searchApps(text, 8);
  if (!apps.length) throw '❌ ما لقيت أي نتيجة بهذا الاسم.\nجرب كتابته بالإنجليزي أو بشكل أدق (مثال: Minecraft Pocket Edition)';

  const top = apps[0];
  const caption =
    `*🔎 نتائج البحث عن:* ${text}\n` +
    `*${apps.length} تطبيق مرتبة حسب الدقة والشعبية*\n\n` +
    `*🏆 أفضل نتيجة*\n${appCard(top, false)}\n\n` +
    apps.slice(1).map((a, i) => `*${i + 2}.* ${cut(a.name, 28)} — ${a.rating ? '⭐' + a.rating.toFixed(1) : ''} ${short(a.downloads)}⬇️ — ${fmtSize(a.size)}`).join('\n') +
    `\n\n> اضغط الزر واختر التطبيق للتحميل`;

  const sections = [{
    title: '📦 النتائج',
    rows: apps.map((a, i) => ({
      title: cut(`${i === 0 ? '🏆 ' : ''}${a.name}`, 24),
      description: cut(`${a.rating ? '⭐' + a.rating.toFixed(1) + ' • ' : ''}${short(a.downloads)}⬇️ • ${fmtSize(a.size)} • v${a.ver || '?'}`, 72),
      id: `.apkdl ${a.pkg}`
    }))
  }];

  try {
    await conn.sendButtonNormal(m.chat, {
      media: { url: top.graphic || top.icon || global.IMG.menu },
      mediaType: 'image',
      caption,
      buttons: [{ name: 'single_select', params: { title: '📦 اختر التطبيق', sections } }],
      mentions: [m.sender],
      newsletter: NEWSLETTER
    }, m);
  } catch (e) {
    console.error('[APK] list message failed, sending text list:', e?.message || e);
    await m.reply(caption.replace('> اضغط الزر واختر التطبيق للتحميل', '> للتحميل اكتب: .apkdl اسم_الحزمة') + '\n\n' + apps.map((a, i) => `${i + 1}. .apkdl ${a.pkg}`).join('\n'));
  }
};

handler.usage = ["apk"];
handler.category = "downloads";
handler.command = ["apk", "ابك", "تطبيق"];

import { safe } from '../../system/safe.js';
export default safe(handler, 'apk');
