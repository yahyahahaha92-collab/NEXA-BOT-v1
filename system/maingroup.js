// Main-group rule. SAFE by default: until the owner saves a main group with ".جروب_اساسي هنا",
// the bot answers in EVERY group (private chats are still ignored for non-owners).
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'system', 'maingroup.json');

global.onlyMainGroup ??= true;
global.allowPrivate ??= false;
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')).jid || null; } catch { return null; } };
global.mainGroupJid ??= load();

export const setMainGroup = (jid) => { global.mainGroupJid = jid; fs.writeFileSync(FILE, JSON.stringify({ jid })); };
export const clearMainGroup = () => { global.mainGroupJid = null; try { fs.rmSync(FILE, { force: true }); } catch {} };

export async function isAllowed(m, conn) {
  try {
    if (global.onlyMainGroup === false) return true;
    if (m.isOwner) return true;
    const chat = String(m.chat || '');
    if (!chat.endsWith('@g.us')) return global.allowPrivate === true;   // private chats: blocked unless the owner allowed them
    if (!global.mainGroupJid) return true;             // no main group saved yet -> all groups work
    return chat === global.mainGroupJid;
  } catch (e) {
    console.error('[MAINGROUP]', e?.message || e);
    return true;
  }
}
