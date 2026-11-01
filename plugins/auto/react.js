import { isAllowed } from '../../system/maingroup.js';
export default async function before(m, { conn , bot }) {
  if (m.fromMe) return false;
  if (!(await isAllowed(m, conn))) return false;
  const triggers = {
    "ڤينوم": ["📂", "🗃️", "☕", "🪐", "🐍"],
    "ڤيني": ["🎼", "🎪", "🎨", "🎯", "🎲"]
  };

  const emojis = triggers[m.text];
  if (emojis) {
    const random = emojis[Math.floor(Math.random() * emojis.length)];
    m.react(random);
  }
  
  return false;
}