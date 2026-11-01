// AI commands: Gemini / GPT / Grok / Claude
import { POLLINATIONS_KEY } from '../../system/keys.js';

const MODELS = {
  'جيمني': 'gemini', 'gemini': 'gemini',
  'جيبيتي': 'openai', 'gpt': 'openai',
  'جروك': 'grok', 'grok': 'grok',
  'كلود': 'claude', 'claude': 'claude'
};

const handler = async (m, { text, command }) => {
  if (!text) return m.reply('💙 ~ حط سؤالك جنب الأمر ~ ❤️');
  const model = MODELS[command];
  const prompt = encodeURIComponent(text);
  const url = POLLINATIONS_KEY
    ? `https://gen.pollinations.ai/text/${prompt}?model=${model}&key=${POLLINATIONS_KEY}`
    : `https://text.pollinations.ai/${prompt}?model=${model}`;

  let answer;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    answer = (await res.text()).trim();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${answer.slice(0, 200)}`);
  } catch (e) {
    console.error(`[AI:${model}]`, e);
    throw `❌ النموذج (${model}) مش متاح دلوقتي. بعض النماذج بتحتاج مفتاح مجاني من enter.pollinations.ai`;
  }

  if (!answer) throw '❌ ما جاش رد من النموذج، جرب تاني';
  await m.reply(answer);
};

handler.usage = ["جيمني", "جيبيتي", "جروك", "كلود"];
handler.category = "ai";
handler.command = Object.keys(MODELS);

import { safe } from '../../system/safe.js';
export default safe(handler, 'models');
