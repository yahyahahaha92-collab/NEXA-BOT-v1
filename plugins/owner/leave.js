const handler = async (m, { conn, text }) => {
  m.reply("*اسفه مضطرة اخرج عشان مطوري اشوفكم بعدين ⁦(⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)⁩💙❤️*")
  conn.groupLeave(m.chat)
};

handler.usage = ["اخرج"];
handler.category = "group";
handler.command = ["اخرج"];
handler.owner = true 
import { safe } from '../../system/safe.js';
export default safe(handler, 'leave');