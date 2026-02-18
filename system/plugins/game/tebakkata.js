const fs = require("node:fs");

module.exports = {
    command: "tebakkata",
    alias: [],
    category: ["game"],
    description: "Bermain game Tebak Kata!",
    settings: {
        group: true,
        limit: true
    },
    async run(m, {
        sock,
        Func, db
    }) {
        try {
            const id = m.cht;
            if (!sock.game) {
                sock.game = {};
            }
            if (id in sock.game) {
                return sock.sendMessage(id, {
                    text: `_Masih ada soal yang belum terjawab..._`
                }, {
                    quoted: sock.game[id].execute.msg
                });
            }
            if (!sock.game[id]) {
                sock.game[id] = {};
            }
            sock.game[id].session = 'tebakkata';

            const timeout = 30000;
            const startTime = Date.now();

            const src = JSON.parse(fs.readFileSync("./src/json/game/tebakkata.json"));
            const json = src[Math.floor(Math.random() * src.length)];
            const balance = Math.floor(Math.random() * 50) + 50;

            let caption = `*[ Tebak Kata ]*\n\nJawablah pertanyaan dibawah ini.\n\`${json.soal}\`\n\nWaktu: ${(timeout / 1000).toFixed(2)}\nHadiah:\n- ${balance} Balance`.trim();

            await sock.sendMessage(id, {
                text: caption
            }, {
                quoted: m
            }).then((data) => {
                sock.game[id].execute = {
                    json,
                    startTime,
                    balance,
                    timer: setTimeout(async () => {
                        if (sock.game[id]) {
                            await sock.sendMessage(id, {
                                text: `Waktu habis!\n\n> Jawaban yang benar adalah: ${json.jawaban}`
                            });
                            delete sock.game[id];
                        }
                    }, timeout),
                    msg: data
                };
            });
        } catch (error) {
            console.error("Error in tebakkata command:", error);
        }
    },
};