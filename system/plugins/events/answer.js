const fs = require("fs");

const wordDatabase = JSON.parse(fs.readFileSync("./src/json/game/kbbi.json"));

module.exports = {
    events: async (m, {
        sock,
        db,
        Func
    }) => {
        try {
            const id = m.cht;
            const chatId = m.cht;
            const senderId = m.sender;
            const text = m.body.toLowerCase();
            if (m.isBot) return;

            sock.game = sock.game || {};
            sock.family100 = sock.family100 || {};
            sock.sambungkata = sock.sambungkata || {};
            sock.tebakbomb = sock.tebakbomb || {};
            sock.tictactoe = sock.tictactoe || {};
            sock.suit = sock.suit || {};
            sock.bomb = sock.bomb || {};

            if (sock.game.hasOwnProperty(id)) {
                const gameSession = sock.game[id];
                const {
                    session,
                    execute
                } = gameSession;
                const {
                    startTime,
                    json,
                    balance,
                    timer
                } = execute;

                const isMath = session === "Matematika";
                const isLontong = session === "Cak Lontong";
                const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

                const isCorrect = isMath ?
                    m.body === String(json.jawaban) :
                    m.body.toLowerCase().trim() === json.jawaban.toLowerCase().trim();

                if (isCorrect) {
                    db.list().user[m.sender].balance += balance;

                    const answerMessage = isLontong ?
                        json.desc :
                        json.jawaban;

                    await m.reply({
                        text: `Jawaban Benar!\n\nJawaban: ${answerMessage}\nHadiah:\n- ${balance} Balance\nTerjawab dalam waktu: ${responseTime} detik`
                    });

                    clearTimeout(timer);
                    delete sock.game[id];
                }
            }

            // Family 100
            if (sock.family100.hasOwnProperty(id)) {
                const family100Session = sock.family100[id];
                const answer = m.body.toLowerCase().trim();
                const alreadyAnswered = family100Session.answeredPlayers.some(p => p.answer === answer);

                if (alreadyAnswered) {
                    await m.reply({
                        text: `Jawaban "${answer}" sudah diberikan sebelumnya. Coba jawaban lain!`
                    });
                    return;
                }
                if (family100Session.correctAnswers.includes(answer)) {
                    family100Session.remainingAnswers = family100Session.remainingAnswers.filter(j => j !== answer);

                    const eugencyReward = Math.floor(Math.random() * 50) + 50;
                    family100Session.answeredPlayers.push({
                        user: m.sender,
                        answer,
                        eugency: eugencyReward
                    });

                    let playersAnswered = family100Session.answeredPlayers.map((p, i) =>
                        `${i + 1}. @${p.user.split('@')[0]}\n- Jawaban: ${p.answer}\n- +${p.eugency} Balance`
                    ).join('\n');

                    // let remaining = family100Session.remainingAnswers.map((a, idx) => `- ${a}`).join('\n') || 'Semua jawaban sudah ditemukan!';

                    let finalMessage = `Jawaban Benar!\n\nJawaban: ${answer.toUpperCase()}\nHadiah:\n- ${eugencyReward} Balance\nTersisa *${family100Session.remainingAnswers.length}* jawaban lagi.`;

                    db.list().user[m.sender].balance += eugencyReward * 1;

                    await m.reply({
                        text: finalMessage,
                        mentions: family100Session.answeredPlayers.map(p => p.user)
                    });

                    if (family100Session.remainingAnswers.length === 0) {
                        await m.reply({
                            text: `Semua jawaban sudah ditemukan!\n\nBerikut Detailnya:\n${playersAnswered}`,
                            mentions: family100Session.answeredPlayers.map(p => p.user)
                        });
                        clearTimeout(family100Session.timer);
                        delete sock.family100[id];
                    }
                }
            }

            // --- TIC TAC TOE ---
            if (sock.tictactoe[chatId]) {
                const room = sock.tictactoe[chatId];
                const sender = m.sender;
                // Tambah di events.js bagian TicTacToe
                if (sock.tictactoe[id]?.state === "PENDING") {
                    // let room = sock.tictactoe[id];
                    if (m.sender === room.opponent && ["y", "ya", "t", "tidak"].includes(m.body.toLowerCase())) {
                        if (text === "t" || text === "tidak") {
                            delete sock.tictactoe[id];
                            return m.reply("Tantangan bermain TicTacToe ditolak.");
                        } else {
                            room.o = id;
                            room.game.playerO = m.sender;
                            room.state = "PLAYING";
                            return startGame(m, sock, room);
                        }
                    }
                }

                if (!room?.game || room.state !== "PLAYING") return;

                const isParticipant = [room.game.playerX, room.game.playerO].includes(sender);
                if (!isParticipant) return;

                const isValidInput = /^([1-9]|(me)?nyerah|surr?ender|off|skip)$/i.test(text);
                if (!isValidInput) return;

                const isSurrender = !/^[1-9]$/.test(text);
                if (!isSurrender && sender !== room.game.currentTurn) return;

                const move = isSurrender ? 1 : room.game.turn(sender === room.game.playerO, parseInt(text) - 1);
                if (move <= 0 && !isSurrender) {
                    const msg = {
                        "-3": "Game telah berakhir",
                        "-2": "Input tidak valid.",
                        "-1": "Posisi tidak tersedia.",
                        0: "Posisi tidak valid.",
                    }[move] || "Terjadi kesalahan.";
                    await m.reply(msg);
                    return;
                }

                const isWin = sender === room.game.winner || isSurrender;
                const isTie = room.game.board === 511 && !isWin;

                if (isSurrender) room.game._currentTurn = sender === room.game.playerX;

                const arr = room.game.render().map((v) => {
                    return {
                        X: "❌",
                        O: "⭕",
                        1: "1️⃣",
                        2: "2️⃣",
                        3: "3️⃣",
                        4: "4️⃣",
                        5: "5️⃣",
                        6: "6️⃣",
                        7: "7️⃣",
                        8: "8️⃣",
                        9: "9️⃣",
                    }[v];
                });

                const winner = isSurrender ? room.game.currentTurn : room.game.winner;
                const board = `${arr.slice(0, 3).join("")}\n${arr.slice(3, 6).join("")}\n${arr.slice(6).join("")}`;
                const resultText = isWin ?
                    `Permainan berakhir, @${winner.split("@")[0]} menang!` :
                    isTie ?
                        `Permainan berakhir, hasil SERI!` :
                        `Giliran @${room.game.currentTurn.split("@")[0]}`;

                const output = `*Room ID:* ${room.id}\n\n${board}\n\n${resultText}`;

                await m.reply({
                    text: output,
                    mentions: sock.parseMention(output),
                });

                if (isWin || isTie) {
                    const updateWinrate = Func.updateWinrate;
                    const gameName = "tictactoe";

                    if (isTie) {
                        updateWinrate(db, room.game.playerX, gameName, "tie");
                        updateWinrate(db, room.game.playerO, gameName, "tie");
                    } else {
                        updateWinrate(db, winner, gameName, "win");
                        const loser = [room.game.playerX, room.game.playerO].find(p => p !== winner);
                        updateWinrate(db, loser, gameName, "lose");
                    }

                    delete sock.tictactoe[chatId];
                }
            }

            // Suit PVP
            if (Object.values(sock.suit).find(r => [r.p, r.p2].includes(m.sender) && r.status && r.id)) {
                const {
                    sender,
                    body: cht
                } = m;
                let roof = Object.values(sock.suit).find(r => [r.p, r.p2].includes(m.sender) && r.status && r.id);
                if (roof) {
                    let win = "";
                    let tie = false;

                    if (
                        sender == roof.p2 &&
                        /^(acc(ept)?|terima|gas|oke?|tolak|gamau|nanti|ga(k.)?bisa|y|t)/i.test(cht) &&
                        m.isGroup &&
                        roof.status == "wait"
                    ) {
                        if (/^(tolak|gamau|nanti|n|ga(k.)?bisa|t)/i.test(cht)) {
                            m.reply({
                                text: `@${roof.p2.split`@`[0]} menolak suit, suit dibatalkan`,
                                mentions: [roof.p2],
                            });
                            delete sock.suit[roof.id];
                            return;
                        }

                        roof.status = "play";
                        roof.asal = m.cht;
                        clearTimeout(roof.waktu);
                        m.reply({
                            text: `Sistem telah mengirimkan pilihan kepada @${roof.p.split`@`[0]} & @${roof.p2.split`@`[0]} melalui pesan pribadi.\n\nSilahkan cek pesan pribadi sistem atau klik wa.me/${sock.user.id.split(":")[0].split`@`[0]}`,
                            mentions: [roof.p, roof.p2],
                        });
                        if (!roof.pilih) m.reply(roof.p, `Silahkan Pilih Salah Satu\n\nKirim 'batu', 'gunting' atau 'kertas'`);
                        if (!roof.pilih2) m.reply(roof.p2, `Silahkan Pilih Salah Satu\n\nKirim 'batu', 'gunting' atau 'kertas'`);

                        roof.waktu_milih = setTimeout(() => {
                            if (!roof.pilih && !roof.pilih2) {
                                m.reply({
                                    text: `@${roof.p.split`@`[0]} dan @${roof.p2.split`@`[0]} Tidak Niat Bermain, Suit Dibatalkan!`,
                                    mentions: [roof.p, roof.p2],
                                });
                            } else if (!roof.pilih || !roof.pilih2) {
                                win = !roof.pilih ? roof.p2 : roof.p;
                                m.reply({
                                    text: `@${(roof.pilih ? roof.p2 : roof.p).split`@`[0]} Tidak Memilih, Suit dibatalkan!`,
                                    mentions: [roof.p2, roof.p],
                                });
                            }
                            delete sock.suit[roof.id];
                        }, roof.timeout);
                        return;
                    }

                    if (roof.status == "play") {
                        let g = /gunting/i;
                        let b = /batu/i;
                        let k = /kertas/i;

                        if (!roof.pilih && roof.p == sender && (g.test(cht) || b.test(cht) || k.test(cht))) {
                            roof.pilih = cht.toLowerCase();
                            roof.text = g.test(cht) ? "✌️" : b.test(cht) ? "✊" : "✋";
                            m.reply(`Kamu memilih ${roof.pilih} (${roof.text})`);
                        }

                        if (!roof.pilih2 && roof.p2 == sender && (g.test(cht) || b.test(cht) || k.test(cht))) {
                            roof.pilih2 = cht.toLowerCase();
                            roof.text2 = g.test(cht) ? "✌️" : b.test(cht) ? "✊" : "✋";
                            m.reply(`Kamu memilih ${roof.pilih2} (${roof.text2})`);
                        }

                        if (roof.pilih && roof.pilih2) {
                            clearTimeout(roof.waktu_milih);
                            const stage = roof.pilih;
                            const stage2 = roof.pilih2;

                            if (b.test(stage) && g.test(stage2)) win = roof.p;
                            else if (b.test(stage) && k.test(stage2)) win = roof.p2;
                            else if (g.test(stage) && k.test(stage2)) win = roof.p;
                            else if (g.test(stage) && b.test(stage2)) win = roof.p2;
                            else if (k.test(stage) && b.test(stage2)) win = roof.p;
                            else if (k.test(stage) && g.test(stage2)) win = roof.p2;
                            else if (stage === stage2) tie = true;

                            let teks;
                            if (tie) {
                                teks = `*Hasil Suit:* SERI!\n` +
                                    `@${roof.p.split('@')[0]} (${roof.text}) vs @${roof.p2.split('@')[0]} (${roof.text2})`;
                            } else {
                                const winner = win;
                                const loser = win === roof.p ? roof.p2 : roof.p;
                                const winnerChoice = win === roof.p ? roof.text : roof.text2;
                                const loserChoice = win === roof.p ? roof.text2 : roof.text;

                                teks = `*Hasil Suit:* @${winner.split('@')[0]} Menang!\n\n` +
                                    `${winnerChoice} vs ${loserChoice}\n\n` +
                                    `Mengalahkan @${loser.split('@')[0]}`;
                            }

                            m.reply(roof.asal, {
                                text: teks.trim(),
                                mentions: [roof.p, roof.p2],
                            }, {
                                quoted: null
                            });

                            delete sock.suit[roof.id];
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error in events handler:", error);
        }
    },
};