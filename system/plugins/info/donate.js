module.exports = {
    command: "donate",
    alias: ["donate", "qris"],
    category: ["info"],
    settings: {},
    description: "Qris Untuk Donate dll",
    async run(m, {
        sock,
        Scraper,
        Func,
        text,
        config
    }) {
        let dot = `[LOL. ID PAYMENT]`;
        m.reply({
            image: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/530139727_1457099688847715_5810929749879716034_n.enc?ccb=11-4&oh=01_Q5Aa2QFfH7esVTmQ_3tGZofwYVAki4J0XKX9wjmItKQmzrfysQ&oe=68BE123E&_nc_sid=5e03e0&mms3=true"
            },
            caption: dot
        });
    },
};