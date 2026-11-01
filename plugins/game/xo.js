import { box, quick, select, sendUI } from '../../system/ui.js';

const nick = (id) => '@' + id.split('@')[0];
const drawBoard = b => [0, 3, 6].map(i =>
  b.slice(i, i + 3).map((c, idx) => c ? (c === 'X' ? '❌' : '⭕') : `${i + idx + 1}️⃣`).join(' │ ')
).join('\n──┼───┼──\n');

const checkWinner = b => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, c, d] of lines) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return null;
};

// move picker: a list of the free squares (the id is just the number, which the game understands)
const moveButtons = (game) => {
  const rows = game.board.map((c, i) => c ? null : { title: `المربع ${i + 1}`, description: 'اضغط لتلعب هنا', id: String(i + 1) }).filter(Boolean);
  return [select('🎯 اختر مربعاً', rows, 'المربعات الفارغة'), quick('🗑️ إنهاء اللعبة', '.اكس حذف')];
};

async function handler(m, { command, text, conn }) {
  global.xoGames ??= {};
  const game = global.xoGames[m.chat];
  const [cmd] = (text || '').trim().toLowerCase().split(' ');
  const isDelete = cmd === 'delete' || cmd === 'حذف';
  const isJoin = cmd === 'join' || cmd === 'انضمام';

  if (isDelete) {
    if (!game) throw "❌ لا توجد لعبة نشطة للحذف!";
    if (game.player1 !== m.sender && game.player2 !== m.sender) throw "❌ فقط اللاعبين يمكنهم حذف اللعبة!";
    delete global.xoGames[m.chat];
    return sendUI(conn, m, { text: box('🗑️', 'لعبة XO', 'تم حذف اللعبة', ''), buttons: [quick('🎮 لعبة جديدة', '.اكس')] });
  }

  // join (second player)
  if (game && game.status === 'waiting' && game.player1 !== m.sender) {
    game.player2 = m.sender;
    game.status = 'playing';
    return sendUI(conn, m, {
      text: box('🎮', 'بدأت اللعبة!', `${drawBoard(game.board)}\n\n❌ ${nick(game.player1)}\n⭕ ${nick(game.player2)}\n\n👉 *الدور:* ${nick(game.player1)}`, 'اختر مربعاً من الزر أو اكتب رقمه'),
      buttons: moveButtons(game),
      mentions: [game.player1, game.player2]
    });
  }
  if (isJoin) throw game ? "❌ اللعبة بدأت بالفعل أو لا يمكنك اللعب ضد نفسك!" : "❌ لا توجد لعبة للانضمام! اكتب *.اكس* لإنشاء لعبة.";

  if (game) {
    return sendUI(conn, m, {
      text: box('⚠️', 'توجد لعبة نشطة', game.status === 'waiting' ? `${nick(game.player1)} ينتظر خصماً` : 'اللعبة جارية الآن', 'اضغط الزر للانضمام أو للإنهاء'),
      buttons: [...(game.status === 'waiting' ? [quick('🎮 انضم للعبة', '.اكس')] : []), quick('🗑️ إنهاء اللعبة', '.اكس حذف')],
      mentions: [game.player1]
    });
  }

  global.xoGames[m.chat] = { player1: m.sender, player2: null, board: Array(9).fill(null), turn: 'X', status: 'waiting' };
  return sendUI(conn, m, {
    text: box('🎮', 'تم إنشاء لعبة XO', `${nick(m.sender)} ❌ ينتظر خصماً ⭕`, 'اضغط الزر لتنضم وتبدأ اللعب'),
    buttons: [quick('🎮 انضم للعبة', '.اكس'), quick('🗑️ إلغاء', '.اكس حذف')],
    mentions: [m.sender]
  });
}

handler.before = async (m, { conn }) => {
  if (!m.text || !global.xoGames?.[m.chat]) return false;
  const game = global.xoGames[m.chat];
  if (game.status !== 'playing') return false;

  const currentPlayer = game.turn === 'X' ? game.player1 : game.player2;
  if (m.sender !== currentPlayer) return false;

  const move = parseInt(m.text.trim()) - 1;
  if (move < 0 || move > 8 || isNaN(move)) return false;
  if (game.board[move] !== null) { await m.reply("❌ هذا المربع مشغول بالفعل!"); return true; }

  game.board[move] = game.turn;
  const winner = checkWinner(game.board);

  if (winner || game.board.every(cell => cell)) {
    let body, winnerJid;
    if (winner) {
      winnerJid = winner === 'X' ? game.player1 : game.player2;
      body = `${drawBoard(game.board)}\n\n🎉 ${nick(winnerJid)} فاز!`;
      if (global.db?.users[winnerJid]) {
        global.db.users[winnerJid].xp = (global.db.users[winnerJid].xp || 0) + 500;
        global.db.users[winnerJid].cookies = (global.db.users[winnerJid].cookies || 0) + 10;
        body += `\n\n🏆 +500 XP | 🍪 +10 كوكيز`;
      }
    } else {
      body = `${drawBoard(game.board)}\n\n🤝 تعادل!`;
    }
    delete global.xoGames[m.chat];
    await sendUI(conn, m, {
      text: box(winner ? '🏆' : '🤝', winner ? 'انتهت اللعبة' : 'تعادل', body, ''),
      buttons: [quick('🔁 لعبة جديدة', '.اكس'), quick('📋 قائمة الألعاب', '.menu 9')],
      mentions: [game.player1, game.player2]
    });
    return true;
  }

  game.turn = game.turn === 'X' ? 'O' : 'X';
  const nextPlayer = game.turn === 'X' ? game.player1 : game.player2;
  await sendUI(conn, m, {
    text: box('🎮', 'لعبة XO', `${drawBoard(game.board)}\n\n👉 *الدور:* ${nick(nextPlayer)} (${game.turn === 'X' ? '❌' : '⭕'})`, 'اختر مربعاً من الزر أو اكتب رقمه'),
    buttons: moveButtons(game),
    mentions: [nextPlayer]
  });
  return true;
};

handler.usage = ["اكس"];
handler.category = "games";
handler.command = ['اكس', 'xo'];
handler.usePrefix = true;
import { safe } from '../../system/safe.js';
export default safe(handler, 'xo');
