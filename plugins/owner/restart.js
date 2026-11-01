const test = async (m, { conn, bot }) => {
  m.react("🟢")
  
  conn.msgUrl(m.chat, "♡゙ Bot is restarting...", { 
    title: "𝘕𝘌𝘟𝘈 𝘪𝘴 𝘢 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 𝘣𝘰𝘵 𝘣𝘺 ꧁リヴァイ꧂",
    body: "𝑇𝒉𝑒 𝑏𝑜𝑡 𝑖𝑠 𝑠𝑖𝑚𝑝𝑙𝑒 𝑡𝑜 𝑚𝑜𝑑𝑖𝑓𝑦",
    img: global.IMG.profile,
    big: false 
  });
  
  setTimeout(() => {
    bot.restart();
  }, 1000); 
};

test.usage = ["رستارت"]
test.category = "owner";
test.command = ["رستارت", "restart"];
test.owner = true;
import { safe } from '../../system/safe.js';
export default safe(test, 'restart');