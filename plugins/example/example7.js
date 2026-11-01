const example = async (m, { conn }) => {

conn.circular(m.chat, { 
   vid: "https://c.termai.cc/v197/1Aw.mp4", // video url or buffer
   sec: 200 // duration in seconds
}, m)

};

example.usage = ["تست7"]
example.category = "example";
example.command = ["تست7"]
import { safe } from '../../system/safe.js';
export default safe(example, 'example7');