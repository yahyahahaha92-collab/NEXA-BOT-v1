const run = async (m, { conn, bot }) => {
  const sub = global.subBots;
  if (!sub) return m.reply("❌ نـظـام الـبـوتـات الـفـرعـيـه غير متاح");

  const bots = sub.list();
  if (bots.length === 0) return m.reply("📭 لا يوجد بوتات فرعية مثبتة");

  let text = `🤖⤿ الـبـوتـات الـفـرعـيـه 
*╮┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ـ*\n`;
  
  const mentions = [];
  
  bots.forEach((b, i) => {
    const jid = b.phone ? `${b.phone}@s.whatsapp.net` : null;
    if (jid) mentions.push(jid);
    
    text += `🫒 *#${i+1}* \n`;
    text += `📱 — الرقم: ${jid ? `@${b.phone}` : b.phone || 'غير معروف'}\n`;
    text += `📍 — الحالة: ${b.connected ? '🟢 متصل' : '🔴 غير متصل'}\n`;
    text += `📨 — الرسائل: ${b.messages || 0}\n`;
    text += `🆔 — الايدي: ${b.id}\n`;
    text += `╯┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ـ\n`;
  });
  
  text += `\n> *_✓ الـمـجـمـوع: ${bots.length}_*`;

  const { images } = bot.config.info;
  const img = images?.[Math.floor(Math.random() * images.length)] || global.IMG.profile;

  await conn.sendMessage(m.chat, {
    text: text,
    mentions: mentions,
    contextInfo: {
      externalAdReply: {
        title: "𝐍𝐄𝐗𝐀 🎪 | 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐁𝐨𝐭",
        body: "𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚋𝚘𝚝 𝚋𝚢 ꧁リヴァイ꧂",
        thumbnailUrl: img,
        sourceUrl: 'https://whatsapp.com/channel/0029VbDnEPG1iUxfnegKky46',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m });
};

run.command = ["البوتات", "bots"];
run.noSub = true;
run.usage =  ["تنصيب"];
run.category = "sub";
run.owner = true;
import { safe } from '../../system/safe.js';
export default safe(run, 'bots');