import { makeQuiz } from '../../system/quiz.js';
import { safe } from '../../system/safe.js';

const handler = makeQuiz({
  key: 'quiz', title: 'المسابقة', emoji: '🍧', emoji2: '🍬', command: 'مسابقه',
  url: 'https://raw.githubusercontent.com/Xov445447533/Xov11111/master/src/JSON/venom-كتابه.json'
});

handler.usage = ["مسابقه"];
handler.category = "games";
handler.command = ['مسابقه'];
export default safe(handler, 'games');
