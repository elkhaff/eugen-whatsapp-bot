module.exports = {
    command: "demote",
    alias: ["jadimember"],
    category: ["group"],
    settings: {
        group: true,
        admin: true,
        botAdmin: true,
    },
    description: "Menurunkan admin menjadi anggota biasa di grup",
    async run(m, {
        sock,
        text
    }) {
        let who = m.quoted ?
            m.quoted.sender :
            m.mentions.length > 0 ?
            m.mentions[0] :
            false;

        if (!who) {
            return m.reply(`Tag atau balas pesan member yang ingin di unadmin.`);
        }

        let user = await sock.onWhatsApp(who);
        if (!user[0].exists) {
            return m.reply(`Akun WhatsApp ini tidak terdaftar atau sudah tidak aktif.`);
        }

        await sock
            .groupParticipantsUpdate(m.cht, [who], "demote")
            .then(() => {
                m.reply(
                    `Demote member success.`,
                );
            })
            .catch((err) => {
                m.reply(
                    `Pastikan bot memiliki hak admin untuk melakukan perubahan ini.`,
                );
            });
    },
};