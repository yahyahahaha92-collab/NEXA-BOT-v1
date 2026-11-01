let handler = async (m, { conn, bot }) => {
  let watermark = '꧁リヴァイ꧂';
  
  let quoted = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: { conversation: 'NEXA ❤️💙' }
  };
  const owners = bot.config.owners || [];
  const contacts = owners.map((o) => {
    const num = o.jid.split("@")[0];
    const name = o.name || watermark;
    return { vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD` };
  });

  let img = global.IMG.profile;
  
  await conn.sendMessage(m.chat, {
    contacts: { displayName: 'NEXA ~ المطورين', contacts },
    contextInfo: {
      forwardingScore: 2023,
      externalAdReply: {
        title: '𝑇𝛨𝛯 𝛩𝑊𝛮𝛯𝑅',
        body: watermark,
        sourceUrl: 'https://whatsapp.com/channel/0029VbDnEPG1iUxfnegKky46',
        thumbnailUrl: img,
        mediaType: 1,
        showAdAttribution: true,
        renderLargerThumbnail: true
      }
    }
  }, { quoted })
};

handler.command = /^(owner|مطور|المطور)$/i;

handler.usage = ["المطور"];
handler.category = "owner";
import { safe } from '../system/safe.js';
export default safe(handler, 'owner');