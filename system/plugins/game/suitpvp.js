module.exports = {
    command: "suitpvp",
    alias: ["suit"],
    category: ["game"],
    description: "Permainan Suit vs User",
    settings: {
        group: true
    },
    async run(m, {
        sock,
        Func
    }) {
        const {
            sender,
            mentions,
            cht: id,
            quoted
        } = m;
        let timeout = 60000;

        if (!sock.suit) {
            sock.suit = {};
        }

        if (Object.values(sock.suit).find((roof) => [roof.p, roof.p2].includes(sender))) return m.reply({
            text: `Selesaikan suit mu yang sebelumnya`
        });
        if (!quoted && !mentions[0]) return m.reply({
            text: `Mention User yang ingin kamu tantang`
        });
        let lawan = quoted ? quoted.sender : mentions[0];
        if (lawan === sender) return m.reply({
            text: `Tidak bisa bermain dengan diri sendiri !`
        });
        if (Object.values(sock.suit).find((roof) => [roof.p, roof.p2].includes(lawan))) return m.reply({
            text: `Orang yang kamu tantang sedang bermain suit bersama orang lain :(`
        });
        let caption = `@${sender.split`@`[0]} menantang @${lawan.split`@`[0]} untuk bermain suit\n\nSilahkan @${lawan.split`@`[0]} untuk ketik 'y' untuk menerima, 't' untuk menolak`;
        await m.reply({
            text: caption,
            mentions: sock.parseMention(caption),
        }).then(() => {
            sock.suit[id] = {
                id: id,
                p: sender,
                p2: lawan,
                status: "wait",
                waktu: setTimeout(() => {
                    if (sock.suit[id])
                        m.reply({
                            text: `*@${lawan.split`@`[0]}* Tidak merespon\nSuit dibatalkan!`,
                            mentions: [sender, lawan],
                        });
                    delete sock.suit[id];
                }, timeout),
                timeout,
            };
        });
    },
};