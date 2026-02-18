const fs = require("node:fs");

module.exports = {
    command: "family100",
    alias: [],
    category: ["game"],
    description: "Bermain game Family 100!",
    settings: {
        group: true,
        limit: true
    },
    async run(m, { sock, Func, db }) {
        try {
            const id = m.cht;
            if (!sock.family100) {
                sock.family100 = {};
            }
            if (id in sock.family100) {
                return m.reply(
                    { text: `_Masih ada soal yang belum terjawab..._` },
                    { quoted: sock.family100[id].msg }
                );
            }

            const timeout = 60000;
            const startTime = Date.now();

            const src = JSON.parse(fs.readFileSync("./src/json/game/family100.json"));
            const json = src[Math.floor(Math.random() * src.length)];
            const question = json.result.soal;
            const correctAnswers = json.result.jawaban.map((j) => j.toLowerCase().trim());

            let caption = `*[ Family 100 ]*\n\n` +
                `Jawablah pertanyaan dibawah ini.\n\`${question}\`\n\n` +
                `Terdapat *${correctAnswers.length}* jawaban.` +
                (json.result.jawaban.find((v) => v.includes(" ")) ? `\n(beberapa jawaban mengandung spasi)` : "") +
                `\nWaktu: ${(timeout / 1000).toFixed(2)} detik.`;

            await m.reply({ text: caption }).then((msg) => {
                sock.family100[id] = {
                    question,
                    correctAnswers,
                    answeredPlayers: [],
                    remainingAnswers: correctAnswers.slice(),
                    participants: [],
                    startTime,
                    msg,
                    timer: setTimeout(async () => {
                        if (sock.family100[id]) {
                            let remaining = sock.family100[id].remainingAnswers
                                .map((a, idx) => `- ${a}`)
                                .join("\n");

                            let finalMessage = `Sayangnya waktu habis!\n\n` +
                                `Jawaban yang belum terjawab:\n${remaining}`;

                            if (sock.family100[id].answeredPlayers.length > 0) {
                                finalMessage += `\n\n`;
                                finalMessage += sock.family100[id].answeredPlayers
                                    .map(
                                        (p, i) =>
                                            `${i + 1}. @${p.user.split("@")[0]}\n` +
                                            `- Jawaban: ${p.answer.toUpperCase()}\n` +
                                            `- Hadiah: ${p.eugency} Balance`
                                    )
                                    .join("\n");
                            }

                            await m.reply({
                                text: finalMessage,
                                mentions: sock.family100[id].answeredPlayers.map((p) => p.user),
                            });

                            delete sock.family100[id];
                        }
                    }, timeout),
                };
            });
        } catch (error) {
            console.error("Error in family100 command:", error);
        }
    },
};