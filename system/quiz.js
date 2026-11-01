import { box, quick, sendUI } from './ui.js';

// Shared engine for the quick-answer games (مسابقه / تفكيك): decorated messages + buttons
export function makeQuiz({ key, title, emoji, emoji2, command, url, icon }) {
  const st = () => ((global.quizState ??= {})[key] ??= { games: {}, scores: {} });
  const nick = (id) => '@' + id.split('@')[0];
  const buttons = [quick('⏭️ سؤال جديد', `.${command}`), quick('🛑 إنهاء', `.${command} ايقاف`), quick('📋 قائمة الألعاب', '.menu 9')];

  async function handler(m, { conn, text }) {
    const s = st();
    if (s.games[m.chat]) { clearTimeout(s.games[m.chat].timeout); delete s.games[m.chat]; }

    if (['ايقاف', 'stop'].includes((text || '').trim())) {
      delete s.scores[m.chat];
      return sendUI(conn, m, { text: box('🛑', `انتهت لعبة ${title}`, 'تم إنهاء اللعبة', 'اضغط الزر لتبدأ لعبة جديدة'), buttons: [quick('🔁 لعبة جديدة', `.${command}`)] });
    }

    let data;
    try { data = await (await fetch(url, { signal: AbortSignal.timeout(15000) })).json(); }
    catch (e) { console.error(`[${key}] cannot load questions:`, e?.message || e); throw '❌ تعذر تحميل أسئلة اللعبة الآن، جرب بعد شويه'; }
    if (!Array.isArray(data) || !data.length) throw '❌ لا توجد أسئلة متاحة الآن، جرب بعد شويه';

    const q = data[Math.floor(Math.random() * data.length)];
    s.scores[m.chat] ??= {};
    const total = Object.values(s.scores[m.chat]).reduce((a, b) => a + b, 0);

    await sendUI(conn, m, {
      text: box(emoji, `${title} ${emoji2}`, `❓ *${q.question}*\n\n⏳ *لديك 30 ثانية*\n📊 النقاط الموزعة: ${total}/20`, 'اكتب الإجابة بسرعة لتأخذ نقطة'),
      buttons
    });

    s.games[m.chat] = {
      answer: q.response,
      timeout: setTimeout(async () => {
        if (!st().games[m.chat]) return;
        delete st().games[m.chat];
        delete st().scores[m.chat];
        await sendUI(conn, m, {
          text: box('⏰', 'انتهى الوقت', `✅ الإجابة كانت: *${q.response}*`, 'لا أحد أجاب في الوقت المحدد'),
          buttons: [quick('🔁 حاول مرة ثانية', `.${command}`), quick('📋 قائمة الألعاب', '.menu 9')]
        });
      }, 30000)
    };
  }

  handler.before = async (m, { conn }) => {
    const s = st();
    if (!m.text || !s.games[m.chat] || !s.scores[m.chat]) return;
    const game = s.games[m.chat];
    if (m.text.trim() !== game.answer) return;

    clearTimeout(game.timeout);
    delete s.games[m.chat];
    const player = m.sender;
    s.scores[m.chat][player] = (s.scores[m.chat][player] || 0) + 1;
    const total = Object.values(s.scores[m.chat]).reduce((a, b) => a + b, 0);

    if (total >= 20) {
      const entries = Object.entries(s.scores[m.chat]).sort((a, b) => b[1] - a[1]);
      const medals = ['🥇', '🥈', '🥉'];
      const board = entries.map(([id, score], i) => `${medals[i] || '▫️'} ${nick(id)} — *${score}* نقطة`).join('\n');
      const winner = entries[0][0];
      let reward = '';
      if (global.db?.users[winner]) {
        global.db.users[winner].xp = (global.db.users[winner].xp || 0) + 500;
        global.db.users[winner].cookies = (global.db.users[winner].cookies || 0) + 10;
        reward = `\n\n🎁 ${nick(winner)} ربح *+500 XP* و *🍪 +10 كوكيز*`;
      }
      delete s.scores[m.chat];
      await sendUI(conn, m, {
        text: box('🏆', `الفائزون في ${title}`, board + reward, 'مبروك للفائز!'),
        buttons: [quick('🔁 لعبة جديدة', `.${command}`), quick('📋 قائمة الألعاب', '.menu 9')],
        mentions: entries.map(([id]) => id)
      });
      return true;
    }

    await sendUI(conn, m, {
      text: box('✅', 'إجابة صحيحة!', `${nick(player)} 🎉\n📊 نقاطك: *${s.scores[m.chat][player]}*\n📈 المجموع: ${total}/20`, 'السؤال التالي قادم...'),
      buttons: [quick('🛑 إنهاء', `.${command} ايقاف`)],
      mentions: [player]
    });
    setTimeout(() => handler(m, { conn, text: '' }).catch(e => console.error(`[${key}]`, e)), 1200);
    return true;
  };

  return handler;
}
