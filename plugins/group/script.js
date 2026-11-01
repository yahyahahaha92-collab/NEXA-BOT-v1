let handler = async (m, {
    conn,
    bot
}) => {
const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428637387322@newsletter',
        newsletterName: '𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️',
        serverMessageId: 0
    },
    externalAdReply: {
        title: "𝐍𝐄𝐗𝐀 🎪 | 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐁𝐨𝐭",
        body: "𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚋𝚘𝚝 𝚋𝚢 ꧁リヴァイ꧂",
        thumbnailUrl: img,
        sourceUrl: 'https://whatsapp.com/channel/0029VbDnEPG1iUxfnegKky46',
        mediaType: 1,
        renderLargerThumbnail: true
    }
});
const { images } = bot.config.info;
const img = images.random()
await conn.sendMessage(m.chat, { 
  text: `
GitHub: _*https://github.com/yahyahahaha92-collab/NEXA-BOT-v1*_

Video: _*https://youtu.be/hA5aCpvesJE?si=pHAEsbDFTVXe2_sq*_

> *لا تنسي وضع نجمة لـ الريبو 🌟*
`,
  contextInfo: context(m.sender, img)
}, { quoted: reply_status });
}
handler.usage = ["سكريبت"];
handler.category = "group";
handler.command = ["سكريبت", "سورس", "sc"];

import { safe } from '../../system/safe.js';
export default safe(handler, 'script');