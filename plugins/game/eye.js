/*
code: game eye anime
by: 𝐓𝐨𝐣𝐢
restyled: decorated messages + answer buttons
*/
import { box, quick, sendUI } from '../../system/ui.js';

const MAX_ROUNDS = 10;
const DATA_URL = "https://raw.githubusercontent.com/fjfilhfjjg-boop/Pomni-AI/refs/heads/main/%D8%B9%D9%8A%D9%86.md";

const NAMES = [
  "ايرين","نيزوكو","سوكونا","موازن","كيلوا","غون","ايتاتشي","ساسكي","دابي","اوبيتو",
  "نوبارا","ليفاي","يوتا","فريدا","شيده","ياماتو","نامي","ايمو","انيا","جينبي",
  "بوروتو","شانكس","لاو","لوفي","زورو","اكازا","ميكاسا","رين","دوما","كانيكي",
  "غوجو","ساي","نيجي","انمي","ساكورا","اوريتشمارو","ماهيتو","جيرايا","روبين",
  "سانجي","ميهوك","كايدو","مايكي","كورابيكا","شيغاراكي","تينغن","تانجيرو",
  "ميدوريا","كونان","الكيورا","شوتو","غاتارو","بارو","غارا","باكوغو","ماكيما",
  "توجا","باين","كوراما"
];

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
const NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

const getPrize = (rank) => {
  if (rank === 0) return { xp: 500, cookies: 10, emoji: "🥇" };
  if (rank === 1) return { xp: 300, cookies: 5, emoji: "🥈" };
  return { xp: 100, cookies: 2, emoji: "🥉" };
};

const handler = async (m, { conn, text }) => {
  const chatId = m.chat;
  global.gameEye ??= {};

  if (['ايقاف', 'stop'].includes((text || '').trim())) {
    const g = global.gameEye[chatId];
    if (g?.current) clearTimeout(g.current.timer);
    delete global.gameEye[chatId];
    return sendUI(conn, m, { text: box('🛑', 'لعبة العين', 'تم إنهاء اللعبة', ''), buttons: [quick('🔁 لعبة جديدة', '.عين')] });
  }

  const g = global.gameEye[chatId];
  if (g?.current) {
    return sendUI(conn, m, { image: g.current.img, text: g.current.caption, buttons: g.current.buttons });
  }

  if (!g || g.round >= MAX_ROUNDS) {
    if (g) {
      const sorted = Object.entries(g.scores).sort((a, b) => b[1] - a[1]);
      const prizes = [];
      for (let i = 0; i < sorted.length; i++) {
        const [id, score] = sorted[i];
        const prize = getPrize(i);
        if (global.db?.users[id]) {
          global.db.users[id].xp = (global.db.users[id].xp || 0) + prize.xp;
          global.db.users[id].cookies = (global.db.users[id].cookies || 0) + prize.cookies;
        }
        prizes.push(`${prize.emoji} @${id.split('@')[0]} — *${score}* نقطة (+${prize.xp}xp)`);
      }
      await sendUI(conn, m, {
        text: box('🏆', 'انتهت لعبة العين', prizes.length ? prizes.join('\n') : 'ما أجاب أحد', 'شكراً للجميع!'),
        buttons: [quick('🔁 لعبة جديدة', '.عين'), quick('📋 قائمة الألعاب', '.menu 9')],
        mentions: sorted.map(s => s[0])
      });
    }
    global.gameEye[chatId] = { round: 0, scores: {}, current: null };
  }

  const g2 = global.gameEye[chatId];
  g2.round++;

  let char;
  try {
    const data = await fetch(DATA_URL, { signal: AbortSignal.timeout(15000) }).then(r => r.json());
    char = data[Math.floor(Math.random() * data.length)];
  } catch (e) {
    delete global.gameEye[chatId];
    console.error('[EYE] cannot load data:', e?.message || e);
    throw '❌ تعذر تحميل بيانات اللعبة الآن، جرب بعد شويه';
  }

  const wrong = shuffle([...NAMES]).filter(n => n !== char.name).slice(0, 3);
  const opts = shuffle([char.name, ...wrong]);

  const caption = box('👁', `خمّن الشخصية (${g2.round}/${MAX_ROUNDS})`,
    opts.map((o, i) => `${NUM[i]} ${o}`).join('\n') + '\n\n⏳ *لديك 30 ثانية*', 'اضغط الاسم الصحيح من الأزرار');
  const buttons = [...opts.map(o => quick(o, o)), quick('🛑 إنهاء', '.عين ايقاف')];

  await sendUI(conn, m, { image: char.img, text: caption, buttons });

  g2.current = {
    answer: char.name.toLowerCase(),
    opts: opts.map(o => o.toLowerCase()),
    img: char.img,
    caption,
    buttons,
    timer: setTimeout(async () => {
      if (global.gameEye[chatId]?.current) {
        const ans = global.gameEye[chatId].current.answer;
        global.gameEye[chatId].current = null;
        await sendUI(conn, m, { text: box('⏰', 'انتهى الوقت', `✅ الإجابة: *${ans}*`, ''), buttons: [quick('▶️ كمّل', '.عين')] });
      }
    }, 30000)
  };
};

handler.before = async (m, { conn }) => {
  const g = global.gameEye?.[m.chat];
  if (!g?.current || !m.text) return;

  const cur = g.current;
  const answer = m.text.toLowerCase().trim();
  if (!cur.opts.includes(answer)) return;      // not an answer: ignore normal chat

  clearTimeout(cur.timer);
  g.current = null;

  if (answer === cur.answer) {
    g.scores[m.sender] = (g.scores[m.sender] || 0) + 1;
    await sendUI(conn, m, {
      text: box('✅', 'صح!', `@${m.sender.split('@')[0]} 🎉\n📊 نقاطك: *${g.scores[m.sender]}*`, 'الجولة القادمة بعد لحظات...'),
      buttons: [quick('🛑 إنهاء', '.عين ايقاف')],
      mentions: [m.sender]
    });
    setTimeout(() => handler(m, { conn, text: '' }).catch(e => console.error('[EYE]', e)), 1500);
  } else {
    await sendUI(conn, m, {
      text: box('❌', 'إجابة غلط', `الإجابة الصحيحة: *${cur.answer}*`, ''),
      buttons: [quick('▶️ كمّل', '.عين')]
    });
  }
  return true;
};

handler.command = ['عين', 'eye'];
handler.category = "games";
handler.usage = ["عين"];
import { safe } from '../../system/safe.js';
export default safe(handler, 'eye');
