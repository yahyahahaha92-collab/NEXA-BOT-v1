import { searchApps, appCard } from '../../system/apk.js';
import { fmtSize, MAX_SEND_BYTES } from '../../system/dl.js';

// .apkdl <package>  (used by the list of .apk)
const handler = async (m, { conn, text }) => {
  const pkg = (text || '').trim();
  if (!pkg) throw '❌ اكتب اسم الحزمة، أو استعمل .apk للبحث أولاً';

  let app = global.apkCache?.get(pkg);
  if (!app) {
    const found = await searchApps(pkg, 5);
    app = found.find(a => a.pkg === pkg) || found[0];
  }
  if (!app) throw '❌ ما لقيت التطبيق، ابحث من جديد بـ .apk';

  await m.react('📥');
  const card = appCard(app, false);
  try {
    if (app.icon) await conn.sendMessage(m.chat, { image: { url: app.icon }, caption: card + '\n\n> _*❲ ⏱️ ❳ الرجاء الانتظار قليلاً...*_' }, { quoted: m });
    else await m.reply(card);
  } catch { await m.reply(card); }

  if (app.size > MAX_SEND_BYTES) {
    return m.reply(`*⚠️ حجم التطبيق كبير (${fmtSize(app.size)})*\nالسيرفر الحالي لا يستطيع رفع ملفات فوق ${fmtSize(MAX_SEND_BYTES)} على واتساب، فهذا رابط التحميل المباشر:\n\n${app.link}`);
  }

  try {
    await conn.sendMessage(m.chat, {
      document: { url: app.link },
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${app.name}.apk`,
      caption: `*${app.name}* v${app.ver || ''}`
    }, { quoted: m });
    await m.react('✅');
  } catch (e) {
    console.error('[APKDL] send failed:', e?.stack || e);
    throw `❌ تعذر إرسال الملف، حمّله من هنا:\n${app.link}`;
  }
};

handler.command = ["apkdl"];

import { safe } from '../../system/safe.js';
export default safe(handler, 'apkdl');
