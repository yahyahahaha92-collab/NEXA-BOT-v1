// Wraps a command handler:
//  - reacts to the command message with an emoji (every command has its own symbol)
//  - if the command throws a STRING (a user-facing message), reply with it in the chat
//  - for real errors, print the full error in the console and rethrow it
const BY_CATEGORY = {
  downloads: '📥', group: '🐞', sticker: '🌄', example: '❇️', tools: '🚀', search: '🌐', admin: '👨‍💼', games: '🎮', gif: '✴️',
  bank: '💰', ai: '🤖', sub: '❤️', info: '🗃️', nicknames: '🎠', logos: '🎡', voices: '📢', fun: '🎭', levels: '🏅', owner: '👑'
};
const MENU = '🎪';
const BY_COMMAND = {
  menu: MENU, 'اوامر': MENU, 'الاوامر': MENU, 'القائمة': MENU, 'قائمة': MENU, 'المهام': MENU,
  apk: '📦', 'ابك': '📦', 'تطبيق': '📦', 'اغنيه': '🎵', 'اغنية': '🎵', play: '🎵', 'فيديو': '🎬', video: '🎬', 'يوتيوب': '🎬', ytmp4: '🎬',
  'يوت_اغنيه': '🎧', ytmp3: '🎧', 'انستا': '📸', ig: '📸', instagram: '📸', 'تيك': '🎶', tiktok: '🎶', tt: '🎶', 'فيس': '📘', fb: '📘',
  'ميديافاير': '🔥', mf: '🔥', mediafire: '🔥', 'جيت': '🐙', github: '🐙', gitclone: '🐙', 'سبوتيفاي': '🟢', 'انمي': '🍥',
  'تخيل': '🎨', imagine: '🎨', 'توليد': '🎞️', 'جيمني': '✨', 'جيبيتي': '🧠', 'جروك': '⚡', 'كلود': '🤎', 'اوبن': '🧠', 'بوت': '🤖',
  'نكتة': '😂', 'حكمة': '📜', 'صراحة': '🫣', 'جرأة': '😈', 'عملة': '🪙', 'نرد': '🎲', 'كرة': '🎱', 'حجر': '✂️', 'نسبة_الحب': '💘', 'مزاج': '🎭',
  'شرح': '📖', 'مستوى': '🏅', 'ترتيب': '🏆', 'متصلين': '🟢', 'تحديث': '🔄', 'فحص_تحديث': '🔎', 'ملصق': '🖼️', 'مسابقه': '🍧', 'علم': '🌍',
  'عين': '👁', 'اكس': '❌', 'تفكيك': '🔨', 'سرقة': '🥷', 'يومي': '🎁', 'اسبوعي': '🎁', 'شهري': '🎁', 'بروفايل': '🪪', 'تسجيل': '📝',
  'بنج': '⚡', 'المطور': '👨‍💻', 'معلومات': 'ℹ️', 'قفل': '🔒', 'فتح': '🔓', 'انذار': '⚠️', 'طرد': '🚪', 'منشن': '📣', 'مخفي': '👻',
  'تفاعل': '🎭', 'جروب_اساسي': '🏠', 'رستارت': '♻️', 'ايقاف': '🛑'
};
const skip = new Set(['apkdl', 'songdl']);

export const safe = (fn, name = '') => {
  if (typeof fn !== 'function') return fn;
  const wrapped = async function (...args) {
    const m = args[0];
    const cmd = String(args[1]?.command || (Array.isArray(fn.usage) ? fn.usage[0] : '') || '').toLowerCase();
    // reaction on the command message (not awaited, so it never slows the command)
    try {
      if (!skip.has(cmd) && m?.react) {
        const emoji = BY_COMMAND[cmd] || BY_CATEGORY[fn.category];
        if (emoji) Promise.resolve(m.react(emoji)).catch(() => {});
      }
    } catch {}
    try {
      return await fn.apply(this, args);
    } catch (e) {
      if (typeof e === 'string') {
        try { await m.reply(e); } catch (err) { console.error('[CMD reply failed]', err); }
        return;
      }
      const label = name || (Array.isArray(fn.usage) ? fn.usage[0] : '') || 'command';
      console.error(`[CMD ERROR] ${label}:`, e?.stack || e);
      throw e;
    }
  };
  Object.assign(wrapped, fn);
  return wrapped;
};
