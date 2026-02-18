module.exports = {
    command: "ping",
    alias: ["ping", "p"],
    category: ["main"],
    description: "Periksa kecepatan respon dari bot",
    async run(m, {
        sock,
        config,
        Func
    }) {
        const start = process.hrtime();
        const end = process.hrtime(start);
        const speed = (end[0] * 1000) + (end[1] / 1e6);
        m.reply(`\`${speed.toFixed(4)}\` ms`);
    },
};