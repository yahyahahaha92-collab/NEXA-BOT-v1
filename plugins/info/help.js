import { DESC } from '../../system/help.js';
import { box, quick, sendUI } from '../../system/ui.js';

// .شرح <أمر>  -> explanation + example for any command
const handler = async (m, { conn, text }) => {
  const name = (text || '').trim().replace(/^[./!]/, '').split(/\s+/)[0];
  if (!name) {
    return sendUI(conn, m, {
      text: box('📖', 'شرح الأوامر', 'اكتب اسم الأمر بعد الكلمة\nمثال: *.شرح apk*', 'أو افتح القائمة واختر الأمر من قسمه'),
      buttons: [quick('📋 القائمة', '.menu')]
    });
  }
  const entry = DESC[name] || DESC[name.toLowerCase()];
  if (!entry) {
    return sendUI(conn, m, {
      text: box('❓', 'أمر غير معروف', `ما لقيت شرحاً للأمر *${name}*`, 'افتح القائمة وشوف أسماء الأوامر الصحيحة'),
      buttons: [quick('📋 القائمة', '.menu')]
    });
  }
  const [desc, example] = entry;
  return sendUI(conn, m, {
    text: box('📖', `شرح الأمر: ${name}`, `*❲ 📝 ❳ الشرح:*\n${desc}\n\n*❲ 💡 ❳ مثال:*\n\`${example}\``, 'اضغط الزر للرجوع للقائمة'),
    buttons: [quick('📋 القائمة', '.menu')]
  });
};

handler.usage = ['شرح'];
handler.category = 'info';
handler.command = ['شرح', 'help', 'مساعدة'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'help');
