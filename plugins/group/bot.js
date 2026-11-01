let handler = async (m, { conn }) => {
    await conn.circular(m.chat, { vid: "https://c.termai.cc/v131/4gX.mp4", sec: 200 }, m);
}

handler.command = ["بوم"];
handler.usePrefix = false;

handler.usage = ["بوم"];
handler.category = "group";
import { safe } from '../../system/safe.js';
export default safe(handler, 'bot');