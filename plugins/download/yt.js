import { sendYoutube } from '../../system/ytget.js';

// .يوتيوب <رابط أو اسم>  -> video   |   .يوت_اغنيه <رابط أو اسم> -> audio
const handler = async (m, { conn, command, text }) => {
  const isAudio = command === 'يوت_اغنيه' || command === 'ytmp3';
  await sendYoutube(m, conn, text, isAudio);
};

handler.usage = ["يوتيوب", "يوت_اغنيه"];
handler.category = "downloads";
handler.command = ['يوت_اغنيه', 'يوتيوب', "ytmp3", "ytmp4"];

import { safe } from '../../system/safe.js';
export default safe(handler, 'yt');
