const handler = async (m, { conn, text }) => {
  m.reply("*تم رفعك ادمن يا مطوري 🌹⁦(⁠≧⁠▽⁠≦⁠)⁩*")
  await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote');
  
};

handler.usage = ["ارفعني"];
handler.category = "owner";
handler.command = ["ارفعني"];
handler.owner = true 
handler.botAdmin = true 

import { safe } from '../../system/safe.js';
export default safe(handler, 'I_m_admin');