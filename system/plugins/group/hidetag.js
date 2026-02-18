module.exports = {
    command: "hidetag",
    alias: ["h", "ht"],
    category: ["group"],
    settings: {
        group: true,
        admin: true,
        botAdmin: true,
    },
    async run(m, {
        sock
    }) {
        let msg = m.text;
        let member = m.metadata?.participants.map(a => a.id);
        m.reply2({ text: msg, mentions: member });
    }
}