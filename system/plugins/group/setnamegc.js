module.exports = {
    command: "setnamegroup",
    alias: ["setnamegc"],
    category: ["group"],
    settings: {
        group: true,
        admin: true,
        botAdmin: true,
    },
    description: "Mengubah nama grup ke nama yang baru",
    async run(m, {
        sock,
        text
    }) {
        if (!text) return m.reply(`Kirim ${m.prefix + m.command} arg1`);

        await sock.groupUpdateSubject(m.cht, text.trim());
        m.reply(
            `Nama grup berhasil diubah!`
        );
    },
};