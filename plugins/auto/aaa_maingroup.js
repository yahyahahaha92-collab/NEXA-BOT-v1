import { isAllowed } from '../../system/maingroup.js';
import { box, link, sendUI } from '../../system/ui.js';

const GROUP = 'https://chat.whatsapp.com/IsJS3Nh4ipS8kpOH5sJBcq?s=cl&p=a&mlu=4&ilr=4';
const CHANNEL = 'https://whatsapp.com/channel/0029VbDnEPG1iUxfnegKky46';
const SECTIONS = {
  downloads: ['الـتـحـمـيـل', '📂'], group: ['الـمـجـمـوعـات', '🐞'], sticker: ['الـمـلـصـقـات', '🌄'], example: ['امـثـلـه', '❇️'],
  tools: ['الادوات', '🚀'], search: ['الـبـحـث', '🌐'], admin: ['الادمـن', '👨‍💼'], games: ['الالـعـاب', '🎮'], gif: ['الـجـيـف', '✴️'],
  bank: ['الـبـنـك', '💰'], ai: ['الـذكـاء الاصـطـنـاعـي', '🤖'], sub: ['الـبـوتـات الـفـرعـي', '❤️'], info: ['مـعـلـومـات الـبـوت', '🗃️'],
  nicknames: ['الالـقـاب', '🎠'], logos: ['الـلـوجـوهـات', '🎡'], voices: ['تـغـيـر الاصـوات', '📢'], fun: ['الـتـرفـيـه', '🎭'], levels: ['الـمـسـتـويـات', '🏅']
};
const told = new Map();          // one notice per person every 6 hours
const EVERY = 6 * 60 * 60 * 1000;

async function notifyPrivate(m, conn, bot) {
  const last = told.get(m.sender) || 0;
  if (Date.now() - last < EVERY) return;
  told.set(m.sender, Date.now());

  let body = '';
  try {
    const cmds = await bot.getAllCommands();
    for (const [key, [name, emoji]] of Object.entries(SECTIONS)) {
      const names = [...new Set(cmds.filter(c => c.category === key && c.usage?.length).flatMap(c => c.usage.map(u => String(u).split(' ')[0])))];
      if (names.length) body += `${emoji} *${name}*\n${names.map(n => '.' + n).join('  ')}\n\n`;
    }
  } catch {}

  await sendUI(conn, m, {
    text: box('🚫', 'الـبـوت لا يـعـمـل فـي الـخـاص',
      `أهلاً @${m.sender.split('@')[0]} 🌹\nالبوت يعمل داخل *الجروب الأساسي* فقط.\nانضم للجروب واكتب *.menu* لتبدأ ✨\n\n${'┈'.repeat(12)}\n*📋 كل الأوامر المتاحة:*\n\n${body}`.trim(),
      'ادخل الجروب بالزر في الأسفل'),
    buttons: [link('👥 انضم للجروب', GROUP), link('📢 القناة', CHANNEL)],
    mentions: [m.sender]
  });
}

// Blocks messages outside the allowed places (owners are exempt). Returning true stops the pipeline.
export default async function before(m, { conn, bot }) {
  if (m.fromMe) return false;
  if (await isAllowed(m, conn)) return false;
  const chat = String(m.chat || '');
  if (!chat.endsWith('@g.us') && !chat.endsWith('@newsletter') && chat !== 'status@broadcast' && m.sender) {
    try { await notifyPrivate(m, conn, bot); } catch (e) { console.error('[PRIVATE NOTICE]', e?.message || e); }
  }
  return true;
}
