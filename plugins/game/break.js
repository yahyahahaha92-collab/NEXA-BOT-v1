import { makeQuiz } from '../../system/quiz.js';
import { safe } from '../../system/safe.js';

const handler = makeQuiz({
  key: 'break', title: 'تفكيك الكلمات', emoji: '🔨', emoji2: '⚙️', command: 'تفكيك',
  url: 'https://raw.githubusercontent.com/Xov445447533/Xov11111/master/src/JSON/venom-تفكيك.json'
});

handler.usage = ["تفكيك"];
handler.category = "games";
handler.command = ['تفكيك'];
export default safe(handler, 'break');
