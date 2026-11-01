import { setMainGroup, clearMainGroup } from '../../system/maingroup.js';

// .جروب_اساسي            -> status
// .جروب_اساسي هنا        -> make THIS group the main group (use it inside the main group)
// .جروب_اساسي تشغيل|ايقاف|مسح
const handler = async (m, { text }) => {
  const v = (text || '').trim().toLowerCase();

  if (['هنا', 'here'].includes(v)) {
    if (!m.isGroup) throw '❌ اكتب الأمر داخل الجروب الذي تريده أساسياً';
    setMainGroup(m.chat);
    global.onlyMainGroup = true;
    return m.reply(`*✅ تم تعيين هذا الجروب كجروب أساسي*\n\nالبوت الآن يعمل هنا فقط (وللمطورين في كل مكان).\n\n🆔 ${m.chat}`);
  }
  if (v.startsWith('خاص')) {
    const arg = v.replace('خاص', '').trim();
    if (['تشغيل', 'on', '1'].includes(arg)) global.allowPrivate = true;
    else if (['ايقاف', 'off', '0'].includes(arg)) global.allowPrivate = false;
    return m.reply(`*💬 الرد في الخاص: ${global.allowPrivate ? 'مسموح ✅ (يرد على الجميع)' : 'ممنوع ❌ (للمطورين فقط)'}*\n\nللتحكم:\n.جروب_اساسي خاص تشغيل\n.جروب_اساسي خاص ايقاف`);
  }
  if (['تشغيل', 'on', '1'].includes(v)) global.onlyMainGroup = true;
  else if (['ايقاف', 'off', '0'].includes(v)) global.onlyMainGroup = false;
  else if (['مسح', 'clear'].includes(v)) { clearMainGroup(); return m.reply('*🧹 تم مسح الجروب المحفوظ (يعمل البوت في كل الجروبات)*'); }
  else {
    const same = global.mainGroupJid && global.mainGroupJid === m.chat;
    return m.reply(
      `*🏠 الجروب الأساسي*\n\n` +
      `الحالة: ${global.onlyMainGroup === false ? 'متوقف ❌ (يعمل في كل مكان)' : 'مفعل ✅ (يعمل في الجروب الأساسي فقط)'}\n` +
      `الرد في الخاص: ${global.allowPrivate ? 'مسموح ✅' : 'ممنوع ❌'}\nالجروب المحفوظ: ${global.mainGroupJid || 'غير محدد (البوت يعمل في كل الجروبات)'}\n` +
      `هذه المحادثة: ${m.chat}\n` +
      `${m.isGroup ? (same ? '✅ هذا هو الجروب الأساسي' : '⚠️ هذا ليس الجروب الأساسي') : ''}\n\n` +
      `الأوامر:\n.جروب_اساسي هنا  (داخل الجروب الأساسي)\n.جروب_اساسي تشغيل\n.جروب_اساسي ايقاف\n.جروب_اساسي مسح`
    );
  }
  return m.reply(`*🏠 وضع الجروب الأساسي صار: ${global.onlyMainGroup === false ? 'متوقف ❌' : 'مفعل ✅'}*`);
};

handler.owner = true;
handler.usage = ['جروب_اساسي'];
handler.category = 'owner';
handler.command = ['جروب_اساسي', 'maingroup'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'maingroup');
