// .تفاعل تشغيل | .تفاعل ايقاف  (owner only)
const handler = async (m, { text }) => {
  const v = (text || '').trim().toLowerCase();
  if (['تشغيل', 'on', '1'].includes(v)) global.autoReact = true;
  else if (['ايقاف', 'اطفاء', 'off', '0'].includes(v)) global.autoReact = false;
  else {
    return m.reply(`*🎭 التفاعل التلقائي: ${global.autoReact === false ? 'متوقف ❌' : 'مفعل ✅'}*\n\nللتحكم:\n.تفاعل تشغيل\n.تفاعل ايقاف`);
  }
  return m.reply(`*🎭 التفاعل التلقائي صار: ${global.autoReact === false ? 'متوقف ❌' : 'مفعل ✅'}*`);
};

handler.owner = true;
handler.usage = ['تفاعل'];
handler.category = 'owner';
handler.command = ['تفاعل', 'autoreact'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'autoreact');
