const { writeExif } = require(process.cwd() + "/lib/sticker");

module.exports = {
    command: "watermark",
    alias: ["wm"],
    category: ["sticker"],
    description: "Add watermark to sticker",
    settings: { limit: 3 },
    async run(m, { sock, text, config }) {
        try {
            if (!m.quoted) {
                return m.reply(`Kirim/reply stiker, foto, atau video lalu ketik ${m.prefix + m.command} packname|author`);
            }

            const [packname = config.sticker.packname, author = config.sticker.author] =
                (text.split('|') || []).map(t => t.trim());

            if (!/image|video|webp/.test(m.quoted.msg?.mimetype)) {
                return m.reply(`Kirim/reply stiker, foto, atau video lalu ketik ${m.prefix + m.command} packname|author`);
            }

            if (/video/.test(m.quoted.msg?.mimetype) && m.quoted.msg?.seconds > 25) {
                return m.reply('Durasi maksimal video adalah 25 detik!');
            }

            await m.react("🎉");
            const sticker = await writeExif({
                mimetype: m.quoted.msg.mimetype,
                data: await m.quoted.download()
            }, {
                packName: packname,
                packPublish: author
            });

            if (sticker) {
                await m.reply({ sticker });
            } else {
                await m.reply('Gagal membuat stiker dengan watermark.');
            }
        } catch (error) {
            console.error("Error in wm command:", error);
            await m.reply("Gagal memproses watermark. Silakan coba lagi.");
        }
    }
}