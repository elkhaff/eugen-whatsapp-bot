module.exports = {
    command: "cekip",
    category: ["owner"],
    settings: {
        owner: true
    },
    description: "Mengecek IP Publik VPS",
    async run(m, {
        Func
    }) {
        await m.reply("_Sedang mengecek IP VPS..._");
        try {
            let res = await Func.fetchJson("https://api.ipify.org?format=json");
            let ip = res.ip;

            let detail = await Func.fetchJson(`http://ip-api.com/json/${ip}`);

            let caption = `┌─  「 *VPS INFO* 」\n`;
            caption += `│  ◦ *IP* : ${ip}\n`;
            caption += `│  ◦ *ISP* : ${detail.isp || "-"}\n`;
            caption += `│  ◦ *Region* : ${detail.regionName || "-"}\n`;
            caption += `│  ◦ *City* : ${detail.city || "-"}\n`;
            caption += `│  ◦ *Country* : ${detail.country || "-"}\n`;
            caption += `└───────────────`;

            m.reply(caption);
        } catch (e) {
            console.error(e);
            m.reply("❌ Gagal mengambil data IP.");
        }
    }
};