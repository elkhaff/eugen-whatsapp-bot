const fs = require("node:fs");
const beauty = require("js-beautify");

module.exports = {
    command: "scrape",
    alias: ["skrep", "scraper"],
    category: ["owner"],
    settings: {
        owner: true,
    },
    description: "⚙️ *Pengelolaan Scraper Bot* 📈",
    async run(m, {
        sock,
        Func,
        text,
        config,
        Scraper
    }) {
        let src = await Scraper;

        if (!text)
            return m.reply(`> *- 乂 Cara Penggunaan Scraper Bot*\n\n> *\`--get\`* - Untuk mengambil scraper yang ada\n> *\`--add\`* - Untuk menambahkan scraper baru\n> *\`--delete\`* - Untuk menghapus scraper yang ada\n\n> *- 乂 Daftar Scrapers yang tersedia :*\n${Object.keys(src).map((a, i) => `> *${i + 1}.* ${a}`).join("\n")}`);

        if (text.includes("--get")) {
            let input = text.replace("--get", "").trim();
            if (!isNaN(input)) {
                let list = Object.keys(src);
                try {
                    let file = scraper.dir + "/" + list[parseInt(input) - 1] + ".js";
                    m.reply(fs.readFileSync(file.trim()).toString());
                } catch (e) {
                    m.reply(
                        `> ⚠️ *Scrape* ${list[parseInt(input) - 1]} *tidak ditemukan*, pastikan cek kembali list Scrape yang kamu simpan!`,
                    );
                }
            } else {
                try {
                    let file = scraper.dir + "/" + input + ".js";
                    m.reply(fs.readFileSync(file.trim()).toString());
                } catch (e) {
                    m.reply(
                        `> ⚠️ *Scrape* ${input} *tidak ditemukan*, pastikan cek kembali list Scrape yang kamu simpan!`,
                    );
                }
            }
        } else if (m.text.includes("--add")) {
            if (!m.quoted)
                m.reply("> *Balas pesan yang berisi scraper yang ingin disimpan*");
            let input = m.text.replace("--add", "").trim();
            try {
                let file = scraper.dir + "/" + input + ".js";
                fs.writeFileSync(file.trim(), await beauty(m.quoted.body));
                m.reply("> ✅ *Berhasil menyimpan scraper:* " + input);
            } catch (e) {
                m.reply(`> ❌ *Gagal menyimpan scraper*, coba lagi.`);
            }
        } else if (text.includes("--delete")) {
            let input = text.replace("--delete", "").trim();
            if (!isNaN(input)) {
                let list = Object.keys(src);
                try {
                    let file = scraper.dir + "/" + list[parseInt(input) - 1] + ".js";
                    fs.unlinkSync(file.trim());
                    m.reply("> 🗑️ *Scraper berhasil dihapus*.");
                } catch (e) {
                    m.reply(
                        `> ⚠️ *Scrape* ${list[parseInt(input) - 1]} *tidak ditemukan*, pastikan cek kembali list Scrape yang kamu simpan!`,
                    );
                }
            } else {
                try {
                    let file = scraper.dir + "/" + input + ".js";
                    fs.unlinkSync(file.trim());
                    m.reply("> 🗑️ *Scraper berhasil dihapus*.");
                } catch (e) {
                    m.reply(
                        `> ⚠️ *Scrape* ${input} *tidak ditemukan*, pastikan cek kembali list Scrape yang kamu simpan!`,
                    );
                }
            }
        }
    },
};