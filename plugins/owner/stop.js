const test = async (m, { conn, bot }) => {
  m.react("🟢")
  
  conn.msgUrl(m.chat, "♡゙ Stop the bot...", { 
    title: "𝘕𝘌𝘟𝘈 𝘪𝘴 𝘢 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 𝘣𝘰𝘵 𝘣𝘺 ꧁リヴァイ꧂",
    body: "𝑇𝒉𝑒 𝑏𝑜𝑡 𝑖𝑠 𝑠𝑖𝑚𝑝𝑙𝑒 𝑡𝑜 𝑚𝑜𝑑𝑖𝑓𝑦",
    img: global.IMG.profile,
    big: false 
  });
  
  setTimeout(() => {
    bot.stop();
  }, 1000); 
};

test.category = "owner";
test.command = ["ايقاف", "stop"];
test.owner = true;
test.usage = ["ايقاف"];
import { safe } from '../../system/safe.js';
export default safe(test, 'stop');