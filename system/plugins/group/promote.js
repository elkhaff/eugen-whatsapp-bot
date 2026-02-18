module.exports = {
    command: "promote",
    alias: ["jadiadmin", "newking"],
    category: ["group"],
    settings: {
        group: true,
        admin: true,
        botAdmin: true,
    },
    description: "👑 Menjadikan member sebagai admin grup",
    async run(m, {
        sock,
        text
    }) {
        let who = m.quoted ?
            m.quoted.sender :
            m.mentions.length > 0 ?
            m.mentions[0] :
            false;

        if (!who)
            return m.reply(`Tag atau balas pesan member yang ingin dijadikan admin.`);

        let user = await sock.onWhatsApp(who);
        if (!user[0].exists)
            return m.reply(`Nomor tersebut tidak terdaftar di WhatsApp.`);

        await sock
            .groupParticipantsUpdate(m.cht, [who], "promote")
            .then(() => {
                let name = who.split("@")[0];
                m.reply({
                    text: `Promote member success.`,
                    mentions: [who]
                }, );
            })
            .catch(() => {
                m.reply(
                    `Pastikan bot memiliki hak admin untuk melakukan perubahan ini.`,
                );
            });
    },
};