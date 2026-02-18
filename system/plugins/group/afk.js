module.exports = {
    command: "awayfromkeyboard",
    alias: ["afk"],
    category: ["group"],
    description: "Set status afk for user",
    async run(m, {
        sock,
        config,
        Func, db
    }) {
        const args = m.text.split(" ");
        if (!db.list().group[m.cht].afk) {
            db.list().group[m.cht].afk = {};
        }
        const afkReason = args.join(' ') || 'AwayFromKeyboard';
        const userId = m.sender;
        const afkData = db.list().group[m.cht].afk;

        afkData[userId] = {
            reason: afkReason,
            timestamp: new Date().toISOString()
        };

        const afkMessage = `_*@${userId.split('@')[0]}* I set your AFK: ${afkReason}._`;
        await sock.sendMessage(m.cht, {
            text: afkMessage,
            mentions: [userId]
        });
    },
};