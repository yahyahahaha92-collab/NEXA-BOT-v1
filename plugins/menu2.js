import { sectionImage } from '../system/ui.js';
import { DESC } from '../system/help.js';
const CATEGORIES = [
    [1, 'التـحـمـيـل', 'downloads', '📂'],
    [2, 'الـمـجـمـوعـات', 'group', '🐞'],
    [3, 'الـمـلـصـقـات', 'sticker', '🌄'],
    [4, 'الـمـطـوريـن', 'owner', '🇩🇪'],
    [5, 'امـثـلـه', 'example', '✳️'],
    [6, 'الـادوات', 'tools', '🚀'],
    [7, 'الـبـحـث', 'search', '🌐'],
    [8, 'الادمــن', 'admin', '👨🏻‍⚖️'],
    [9, 'الالــعـاب', 'games', '🎮'],
    [10, 'الچيف', 'gif', '✴️'],
    [11, 'الـبــنـك', 'bank', '💰'],
    [12, 'الـذكـاء الاصـطـنـاعـي', 'ai', '🤖'],
    [13, 'الـبـوتـات الـفـرعـي', 'sub', '♥️'],
    [14, 'مـعـلومـات الـبـوت', 'info', '🗃️'],
    [15, 'الـالــقــاب', 'nicknames', '🫯'],
    [16, 'الـلـوجـوهــات', 'logos', '🎡'],
    [17, 'تـغـيـر الاصـوات', 'voices', '📢'],
    [18, 'أخــرى', 'other', '🌹'],
    [19, 'الـتـرفـيـه', 'fun', '🎭'],
    [20, 'الـمـسـتـويـات', 'levels', '🏅']
];

const getCat = n => CATEGORIES.find(c => c[0] === n);

const getImg = (bot) => {
    const { images } = bot.config.info;
    return Array.isArray(images) ? images[Math.floor(Math.random() * images.length)] : images;
};

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428637387322@newsletter',
        newsletterName: '𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️',
        serverMessageId: 0
    },
    externalAdReply: {
        title: "𝐍𝐄𝐗𝐀 🎪 | 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐁𝐨𝐭",
        body: "𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚋𝚘𝚝 𝚋𝚢 ꧁リヴァイ꧂",
        thumbnailUrl: img,
        sourceUrl: 'https://whatsapp.com/channel/0029VbDnEPG1iUxfnegKky46',
        mediaType: 1,
        renderLargerThumbnail: true
    }
});

const CHANNEL = 'https://whatsapp.com/channel/0029VbDnEPG1iUxfnegKky46';
const GROUP = 'https://chat.whatsapp.com/IsJS3Nh4ipS8kpOH5sJBcq?s=cl&p=a&mlu=4&ilr=4';
const NEWSLETTER = { name: '𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️', jid: '120363428637387322@newsletter' };

const linkButtons = [
    { name: "cta_url", params: { display_text: "📢 القناة", url: CHANNEL } },
    { name: "cta_url", params: { display_text: "👥 الجروب", url: GROUP } }
];

// split long text into parts that fit in an image caption
const chunk = (text, max = 900) => {
    const out = [];
    let cur = '';
    for (const line of text.split('\n')) {
        if ((cur + '\n' + line).length > max && cur) { out.push(cur); cur = line; }
        else cur = cur ? cur + '\n' + line : line;
    }
    if (cur) out.push(cur);
    return out;
};

async function handler(m, { conn, bot, command, args }) {
    const quoted = global.reply_status || m;
    const selected = parseInt(args[0]);
    const now = new Date();
    const up = process.uptime();
    const uptimeFormatted = [Math.floor(up / 3600), Math.floor((up % 3600) / 60), Math.floor(up % 60)]
        .map(v => String(v).padStart(2, '0')).join(':');
    const date = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // ===== Main menu: image + sections list + buttons =====
    if (!selected && !args[0]) {
        let visibleCats = CATEGORIES;
        try {
            const all = await bot.getAllCommands();
            const filtered = CATEGORIES.filter(c => all.some(x => x.category === c[2] && x.usage?.length));
            if (filtered.length) visibleCats = filtered;
        } catch {}
        const sections = [{
            title: "🌳 ~ الاقـسـام ~ 🪾",
            rows: visibleCats.map(c => ({
                title: `${c[0]} ~ ${c[1]} ${c[3]}`,
                description: `اضغط لعرض أوامر قسم ${c[1]}`,
                id: `.${command} ${c[0]}`
            }))
        }];

        const menuText = `
رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ
وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِّلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَّحِيمٌ
╭─┈─┈─┈─⟞🎪⟝─┈─┈─┈─╮
┃ ⌯🍂︙ اهـلا → *[ @${m.sender.split("@")[0]} ]*
┃ ⌯🚀︙ الـتشـغـيـل → ${uptimeFormatted}
┃ ⌯👾︙ الـتـاريـخ → ${date} - ${time}
╰─┈─┈─┈─⟞🎪⟝─┈─┈─┈─╯
> *_اختار قسم من القائمة عشان يبعتلك اوامر القسم_*`;

        await conn.sendButtonNormal(m.chat, {
            media: { url: global.IMG.menu },
            mediaType: 'image',
            caption: menuText,
            buttons: [
                { name: "single_select", params: { title: "🍂✨ الأقسام", sections } },
                ...linkButtons
            ],
            mentions: [m.sender],
            newsletter: NEWSLETTER
        }, quoted);
        return;
    }

    // ===== Section: every command with its explanation + buttons =====
    const cat = getCat(selected);
    if (!cat) {
        await conn.sendMessage(m.chat, { text: `*❌ اختار رقم صحيح من 1 لـ ${CATEGORIES.length}*`, contextInfo: context(m.sender, getImg(bot)) }, { quoted: m });
        return;
    }

    const cmds = await bot.getAllCommands();
    const categoryCmds = cmds.filter(c => c.category === cat[2] && c.usage?.length);

    if (!categoryCmds.length) {
        await conn.sendMessage(m.chat, { text: '*❌ القسم فاضي*', contextInfo: context(m.sender, getImg(bot)) }, { quoted: m });
        return;
    }

    // one entry per command name
    const names = [...new Set(categoryCmds.flatMap(c => c.usage.map(u => String(u).split(' ')[0])))];
    const lines = names.map((n, i) => {
        const d = DESC[n]?.[0];
        return `${cat[3]} *.${n}*${d ? `\n     ↳ ${d}` : ''}`;
    });

    const header = `╭─┈─┈─┈─⟞${cat[3]}⟝─┈─┈─┈─╮\n┃ *⌯︙ قـسـم ${cat[1]} ${cat[3]}*\n┃ *⌯︙ عدد الأوامر: ${names.length}*\n╰─┈─┈─┈─⟞${cat[3]}⟝─┈─┈─┈─╯\n`;
    const footer = `\n> _اختر أمراً من الزر لقراءة شرحه ومثاله_`;
    const parts = chunk(header + '\n' + lines.join('\n') + '\n' + footer);

    // list of commands (10 per page) -> selecting a row shows the command explanation
    const PAGE = 10;
    const pages = Math.ceil(names.length / PAGE);
    const page = Math.min(Math.max(parseInt(args[1]) || 1, 1), pages);
    const rows = names.slice((page - 1) * PAGE, page * PAGE).map(n => ({
        title: `.${n}`.slice(0, 24),
        description: (DESC[n]?.[0] || 'اضغط لعرض الشرح').slice(0, 72),
        id: `.شرح ${n}`
    }));

    const buttons = [{ name: 'single_select', params: { title: `📖 شرح أمر (${page}/${pages})`, sections: [{ title: `${cat[1]}`.slice(0, 24), rows }] } }];
    if (page < pages) buttons.push({ name: 'quick_reply', params: { display_text: '▶️ الصفحة التالية', id: `.${command} ${cat[0]} ${page + 1}` } });
    if (page > 1) buttons.push({ name: 'quick_reply', params: { display_text: '◀️ الصفحة السابقة', id: `.${command} ${cat[0]} ${page - 1}` } });
    buttons.push({ name: 'quick_reply', params: { display_text: '🔙 القائمة الرئيسية', id: `.${command}` } });

    // first part: image + caption + buttons
    const secImg = await sectionImage(cat[2]);
    await conn.sendButtonNormal(m.chat, {
        media: { url: secImg },
        mediaType: 'image',
        caption: parts[0],
        buttons,
        mentions: [m.sender],
        newsletter: NEWSLETTER
    }, quoted);

    // remaining parts (if the list is long): text with image preview
    for (const p of parts.slice(1)) {
        await conn.sendMessage(m.chat, { text: p, contextInfo: context(m.sender, getImg(bot)) }, { quoted: m });
    }
}

handler.command = ['menu', 'المهام', 'القائمة', 'الاوامر', 'اوامر', 'قائمة'];
handler.usage = ["menu"];
handler.category = "info";
import { safe } from '../system/safe.js';
export default safe(handler, 'menu2');
