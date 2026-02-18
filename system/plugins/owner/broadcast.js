const DELAY = 5000;

module.exports = {
    command: "broadcast",
    alias: ["bc"],
    category: ["owner"],
    settings: {
        owner: true
    },
    description: "Broadcast pesan ke semua grup",
    async run(m, {
        sock,
        text
    }) {
        if (!text && !m.quoted) {
            return m.reply("Gunakan format: .bc [pesan] atau reply media dengan caption");
        }

        let allGroups = {};
        try {
            allGroups = await sock.groupFetchAllParticipating();
        } catch (e) {
            allGroups = sock.groupData || {};
        }

        const groups = Object.values(allGroups);
        const botJid = sock.decodeJid(sock.user.id);

        const allowedGroups = groups.filter(group => {
            const botInGroup = group.participants.find(p => sock.decodeJid(p.phoneNumber) === botJid);
            if (!botInGroup) return false;
            if (!group.announce) return true;
            return botInGroup.admin !== null;
        });

        if (allowedGroups.length === 0) {
            return m.reply("Tidak ada grup yang ditemukan atau bot tidak memiliki izin kirim");
        }

        m.reply(`Proses broadcast ke ${allowedGroups.length} grup dimulai`);

        let successCount = 0;

        for (let group of allowedGroups) {
            try {
                const mentions = group.participants.map(p =>
                    p.phoneNumber ? sock.decodeJid(p.phoneNumber) : sock.decodeJid(p.id)
                );

                const content = {
                    caption: text || m.quoted?.text || "",
                    text: text || m.quoted?.text || "",
                    mentions: mentions
                };

                if (m.isQuoted && (m.quoted.mtype === "imageMessage" || m.quoted.mtype === "videoMessage")) {
                    const media = await m.quoted.download();
                    const type = m.quoted.mtype === "imageMessage" ? "image" : "video";

                    await sock.sendMessage(group.id, {
                        [type]: media,
                        caption: content.caption,
                        mentions: content.mentions
                    });
                } else {
                    await sock.sendMessage(group.id, {
                        text: content.text,
                        mentions: content.mentions
                    });
                }

                successCount++;
            } catch (err) {
                console.error(`Gagal: ${group.id}`, err.message);
            }

            await new Promise(res => setTimeout(res, DELAY));
        }

        m.reply(`Broadcast selesai\nTotal: ${allowedGroups.length}\nBerhasil: ${successCount}\nGagal: ${allowedGroups.length - successCount}`);
    }
};