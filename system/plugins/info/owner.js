module.exports = {
    command: "owner",
    alias: ["creator", "developer"],
    category: ["info"],
    settings: {},
    description: "Menampilkan kartu kontak owner",
    async run(m, {
        sock,
        config,
        db
    }) {
        const owners = Array.isArray(config.owner) ? config.owner : [config.owner];
        const userData = db.list().user;
        const contactList = [];
        const captionList = [];

        const defaultEmail = config.email || "dev@anabot.my.id";
        const defaultSite = config.website || "https://github.com/PrinzXz";
        const defaultRegion = config.region || "Indonesia";

        for (let jid of owners) {
            const number = jid.replace(/[^0-9]/g, '');
            const name = userData[jid]?.name || config.ownerName || "Owner";

            const vcard =
                'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${name}\n` +
                `ORG:${config.botName || "WhatsApp Bot"};\n` +
                `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n` +
                `EMAIL:${defaultEmail}\n` +
                `URL:${defaultSite}\n` +
                `ADR:;;${defaultRegion};;;;\n` +
                `NOTE:Developer Bot & Premium Support\n` +
                'END:VCARD';

            contactList.push({
                vcard: vcard,
                displayName: name
            });

            captionList.push(`Nama: ${name}\nNomor: wa.me/${number}`);
        }

        await sock.sendMessage(m.cht, {
            contacts: {
                displayName: `${contactList.length} Developer`,
                contacts: contactList
            }
        }, {
            quoted: m
        });

        const caption = `CONTACT DEVELOPER\n\n` +
            captionList.join('\n\n') +
            `\n\nSimpan nomor di atas jika info kontak tidak muncul.`;

        return m.reply(caption);
    },
};