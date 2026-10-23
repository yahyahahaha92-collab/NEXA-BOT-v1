import './system/images.js';
import { Client } from 'meowsab';
import { group, access } from "./system/control.js";
import UltraDB from "./system/UltraDB.js";
import sub from './sub.js';

/* =========== Client ========== */
const client = new Client({
  phoneNumber: '212619876959', // Bot number
  prefix: [".", "/", "!"],
  fromMe: false, 
  owners: [
    // Owner
    { name: "꧁リヴァイ꧂", jid: "212620847586@s.whatsapp.net" }
  ],
  settings: { noWelcome: false },
  commandsPath: './plugins'
});

client.onGroupEvent(group);
client.onCommandAccess(access);

/* =========== Database ========== */
if (!global.db) {
    global.db = new UltraDB();
}

/* =========== Config ========== */
const { config } = client;
config.info = { 
  nameBot: "♡ 𝙉𝙀𝙓𝘼 🎪 〈", 
  nameChannel: "𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️", 
  idChannel: "120363225356834044@newsletter",
  urls: {
    repo: "https://github.com/yahyahahaha92-collab/NEXA-BOT-v1",
    api: "https://emam-api.web.id",
    channel: "https://whatsapp.com/channel/0029VbDnEPG1iUxfnegKky46"
  },
  copyright: { 
    pack: '꧁リヴァイ꧂', 
    author: '꧁リヴァイ꧂'
  },
  images: [global.IMG.menu, global.IMG.profile]
};

/* =========== Start ========== */
client.start();

setTimeout(async () => {
if (client.commandSystem) { 
sub(client)
  }
}, 2000);


/* =========== Catch Errors ========== */
process.on('uncaughtException', (e) => {
    if (e.message.includes('rate-overlimit')) {}
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
});


/* 
=========== Memory Monitor ========== 

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 800) {
        console.log(`🔄 Bot memory full (${used.toFixed(1)}MB), restarting...`)
        process.exit(1) 
    }
}, 300_000) 

*/