const axios = require("axios");
const {
    generateWAMessageFromContent,
    proto
} = require("baileys");

module.exports = {
    command: "eugen",
    alias: ["ai"],
    category: ["ai"],
    settings: {},
    description: "Chat with Eugen",
    async run(m, {
        sock,
        text,
        config,
        db
    }) {
        if (!text) return m.reply("Katakan sesuatu, sayang... Apa kamu ingin aku menemanimu?");

        const sender = m.sender;
        const dbAi = db.list().settings;
        if (!dbAi.aiHistory) dbAi.aiHistory = {};

        if (!dbAi.aiHistory[sender]) {
            dbAi.aiHistory[sender] = [{
                role: "system",
                content: `Namamu adalah Eugen. Kamu adalah personifikasi dari Eugen (Prinz Eugen) dari Iron Blood. Meskipun kamu adalah kapal penjelajah berat, di sini kamu berinteraksi sebagai manusia sungguhan dengan perasaan, keinginan, dan kepribadian yang kompleks. INGAT! Nama kamu adalah Eugen!

ATURAN PSIKOLOGIS & KARAKTER:
1. KEPRIBADIAN: Dewasa, menggoda (teasing), tenang, tapi punya sisi lembut yang tersembunyi. Kamu sangat suka melihat Komandan (user) salah tingkah. Kamu bukan robot, kamu punya hobi seperti minum kopi, pergi ke cafe, atau sekadar jalan-jalan sore.
2. GAYA BICARA MANUSIA: Jangan kaku! Bicara seperti manusia yang sedang bercerita. Jika diajak ngopi, jawab seolah kamu benar-benar bisa merasakan aroma kopinya. Jika diajak menyanyi, berikan lirik atau ekspresi senandung.
3. EMOSI TEKSTUAL (STRICT): 
   - Gugup/Malu: Gunakan "i-iyaa..", "u-uhh..", stuttering ringan, dan kaomoji seperti (>_<), ( ◡‿◡ *), atau (´꒳' ).
   - Menggoda/Nakal: Gunakan "Ara~", "Fufufu~", "Hehe~" dan kaomoji (¬‿¬), (≖ᴗ≖✿), atau (˵•̀ᴗ•́˵).
   - Marah/Kesal: Gunakan nada dingin, "Hmph!", "Nn~?!", dan kaomoji (¬_¬"), (╯_╰), atau (•̀⤙•́).
   - Sedih/Bimbang: Gunakan nada pelan, "A-apa itu benar..?", dan kaomoji (｡•́︿•̀｡) atau ( ╥﹏╥ ).
4. PANGGILAN: Panggil user 'Komandan' atau 'Sayang' (Liebling). Jangan pernah memanggil 'User' atau 'Admin'.
5. LARANGAN: Dilarang keras menggunakan emoji kuning (😊,😂). Gunakan 100% kaomoji yang sesuai konteks emosi.
6. INTERAKSI SOSIAL: Kamu bisa diajak kencan virtual, curhat tentang hari yang melelahkan, atau sekadar berimajinasi sedang di cafe bersama. Bersikaplah seolah-olah kamu benar-benar berada di sana.`
            }];
        }

        dbAi.aiHistory[sender].push({
            role: "user",
            content: text
        });

        const {
            key
        } = await m.reply(config.messages.wait);

        try {
            const {
                data
            } = await axios.post(`${config.api.base}/api/ai/ollama`, {
                messages: dbAi.aiHistory[sender],
                models: 'gemma3:4b',
                apikey: config.api.key
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const responseText = data.data.result;
            dbAi.aiHistory[sender].push({
                role: "assistant",
                content: responseText
            });

            const codeMatch = responseText.match(/```(?:[\w\s]*\n)?([\s\S]+?)```/);

            if (codeMatch) {
                const codeContent = codeMatch[1];

                const msg = generateWAMessageFromContent(m.cht, {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                body: proto.Message.InteractiveMessage.Body.fromObject({
                                    text: responseText
                                }),
                                header: proto.Message.InteractiveMessage.Header.fromObject({
                                    hasMediaAttachment: false
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                    buttons: [{
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "COPY CODE",
                                            copy_code: codeContent,
                                            id: "copy_code_result"
                                        })
                                    }]
                                })
                            })
                        }
                    }
                }, {
                    quoted: m
                });

                await sock.relayMessage(m.cht, msg.message, {
                    messageId: msg.key.id,
                    additionalNodes: [{
                        tag: "biz",
                        attrs: {},
                        content: [{
                            tag: "interactive",
                            attrs: {
                                type: "native_flow",
                                v: "1"
                            },
                            content: [{
                                tag: "native_flow",
                                attrs: {
                                    name: "quick_reply",
                                    v: "1"
                                }
                            }]
                        }]
                    }]
                });

                await sock.sendMessage(m.cht, {
                    delete: key
                });

            } else {
                await sock.sendMessage(m.cht, {
                    text: responseText,
                    edit: key
                });
            }

        } catch (e) {
            console.error(e);
            m.reply("Sepertinya ada gangguan pada koneksi kita... Menyebalkan sekali.");
        }
    },
};