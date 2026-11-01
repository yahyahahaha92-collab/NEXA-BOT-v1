import { box, quick, sendUI } from '../../system/ui.js';

const DATA_URL = "https://gist.githubusercontent.com/Kyutaka101/799d5646ceed992bf862026847473852/raw/dcbecff259b1d94615d7c48079ed1396ed42ef67/gistfile1.txt";

async function handler(m, { conn, text }) {
    global.gameActive ??= {};
    if (global.gameActive[m.chat]) { clearTimeout(global.gameActive[m.chat].timeout); delete global.gameActive[m.chat]; }

    if (['ايقاف', 'stop'].includes((text || '').trim())) {
        return sendUI(conn, m, { text: box('🛑', 'لعبة العلم', 'تم إنهاء اللعبة', ''), buttons: [quick('🔁 لعبة جديدة', '.علم')] });
    }

    let country;
    try {
        const res = await fetch(DATA_URL, { signal: AbortSignal.timeout(15000) });
        const data = await res.json();
        country = data[Math.floor(Math.random() * data.length)];
    } catch (e) {
        console.error('[COUNTRY] cannot load flags:', e?.message || e);
        throw '❌ تعذر تحميل بيانات الأعلام الآن، جرب بعد شويه';
    }

    await sendUI(conn, m, {
        image: country.img,
        text: box('🌍', 'خمّن العلم', '🏳️ *ما اسم الدولة صاحبة هذا العلم؟*\n\n⏳ *لديك 30 ثانية*\n✍️ اكتب الاسم مباشرة', 'اكتب اسم الدولة بدون رد'),
        buttons: [quick('⏭️ علم تاني', '.علم'), quick('🛑 إنهاء', '.علم ايقاف'), quick('📋 قائمة الألعاب', '.menu 9')]
    });

    global.gameActive[m.chat] = {
        answer: country.name.toLowerCase(),
        image: country.img,
        timeout: setTimeout(async () => {
            if (!global.gameActive[m.chat]) return;
            const answer = global.gameActive[m.chat].answer;
            delete global.gameActive[m.chat];
            await sendUI(conn, m, { text: box('⏰', 'انتهى الوقت', `✅ الإجابة هي: *${answer}*`, ''), buttons: [quick('🔁 حاول مرة ثانية', '.علم')] });
        }, 30000)
    };
}

handler.before = async (m, { conn }) => {
    if (!m.text || !global.gameActive?.[m.chat]) return;
    const game = global.gameActive[m.chat];
    if (m.text.toLowerCase().trim() !== game.answer) return;

    clearTimeout(game.timeout);
    delete global.gameActive[m.chat];

    let reward = '';
    if (global.db?.users[m.sender]) {
        global.db.users[m.sender].xp = (global.db.users[m.sender].xp || 0) + 100;
        global.db.users[m.sender].cookies = (global.db.users[m.sender].cookies || 0) + 2;
        reward = '\n🎁 *+100 XP* و *🍪 +2 كوكيز*';
    }
    await sendUI(conn, m, {
        image: game.image,
        text: box('🎉', 'صحيح! عاش', `@${m.sender.split('@')[0]} عرفت العلم: *${game.answer}*${reward}`, 'هل تقدر تكمل؟'),
        buttons: [quick('⏭️ علم تاني', '.علم'), quick('📋 قائمة الألعاب', '.menu 9')],
        mentions: [m.sender]
    });
    return true;
};

handler.usage = ["علم"];
handler.category = "games";
handler.command = ['علم', 'country'];

import { safe } from '../../system/safe.js';
export default safe(handler, 'country');
