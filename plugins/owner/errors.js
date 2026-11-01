const run = async (m, { bot, conn }) => {
const res = (await bot.errors()).map(x => `\n
#📂 الملف: ${x.file}
#🌱 الأمر: ${x.command}
#❌ الايرور: ${x.error}
==============`).join(" ")
m.reply(res)
}
run.command = ["الايرورات"]
run.usage = ["الايرورات"];
run.category = "owner";
run.owner = true;
import { safe } from '../../system/safe.js';
export default safe(run, 'errors');