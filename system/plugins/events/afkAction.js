module.exports = {
    events: async (m, {
        sock, db
    }) => {
        try {
            const id = m.cht;
            const sender = m.sender;
            if (m.isBot) return;

            if (!db.list().group[id]) db.list().group[id] = {};
            if (!db.list().group[id].afk) db.list().group[id].afk = {};

            const afkData = db.list().group[id].afk;
            const mentionedUsers = [...new Set([...(m.mentions || []), ...(m.quoted ? [m.quoted.sender] : [])])];

            for (const user of mentionedUsers) {
                if (afkData[user]) {
                    const afkReason = afkData[user].reason || "Tanpa alasan";
                    const afkTimestamp = new Date(afkData[user].timestamp);
                    const now = new Date();
                    const afkDuration = formatDuration(now - afkTimestamp);

                    await sock.sendMessage(id, {
                        text: `_*${db.list().user[user]?.name || "User"}* saat ini AFK: "${afkReason}" - ${afkDuration}._`,
                        mentions: [user]
                    }, {
                        quoted: m
                    });
                }
            }

            if (afkData[sender]) {
                const afkTimestamp = new Date(afkData[sender].timestamp);
                const now = new Date();
                const afkDuration = formatDuration(now - afkTimestamp);

                delete afkData[sender];

                await sock.sendMessage(id, {
                    text: `_*${db.list().user[sender]?.name || "User"}* telah kembali dari AFK setelah: *${afkDuration}*_`,
                    mentions: [sender]
                }, {
                    quoted: m
                });
            }
        } catch (error) {
            console.error("Error in events handler:", error);
        }
    },
};

function formatDuration(duration) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));

    return `${days > 0 ? days + ' hari ' : ''}${hours > 0 ? hours + ' jam ' : ''}${minutes > 0 ? minutes + ' menit ' : ''}${seconds > 0 ? seconds + ' detik' : ''}`.trim();
}