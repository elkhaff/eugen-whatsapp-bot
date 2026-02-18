module.exports = {
    command: "refreshgroup",
    alias: ["refreshgc"],
    category: ["group"],
    description: "Refresh Meta Data Group",
    settings: {
        group: true,
        admin: true,
        botAdmin: true,
    },
    async run(m, { sock }) {
        await sock.groupMetadata(m.cht).then((res) => {
            sock.groupData[m.cht] = res;
            m.reply("Berhasil refresh metadata group!");
        });
    },
};
