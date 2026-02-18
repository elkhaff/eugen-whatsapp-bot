module.exports = {
    command: "delete",
    alias: ["d", "del"],
    category: ["tools"],
    settings: {},
    description: "Delete message",
    async run(m, {
        sock
    }) {
        if (m.quoted) {
            await sock.sendMessage(m.cht, {
                delete: m.quoted.key
            });
        }
    }
}