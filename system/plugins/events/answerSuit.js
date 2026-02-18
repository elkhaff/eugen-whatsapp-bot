// module.exports = {
//     events: async (m, { sock, db }) => {
//         if (m.key.fromMe) return;
//         const { sender, body: cht } = m;
//         sock.suit = sock.suit || {};
//         let roof = Object.values(sock.suit).find(
//             (roof) => roof.id && roof.status && [roof.p, roof.p2].includes(sender)
//         );
//         if (roof) {
//             let win = "";
//             let tie = false;

//             if (
//                 sender == roof.p2 &&
//                 /^(acc(ept)?|terima|gas|oke?|tolak|gamau|nanti|ga(k.)?bisa|y|t)/i.test(cht) &&
//                 m.isGroup &&
//                 roof.status == "wait"
//             ) {
//                 if (/^(tolak|gamau|nanti|n|ga(k.)?bisa|t)/i.test(cht)) {
//                     m.reply({
//                         text: `@${roof.p2.split`@`[0]} menolak suit, suit dibatalkan`,
//                         mentions: [roof.p2],
//                     });
//                     delete sock.suit[roof.id];
//                     return;
//                 }

//                 roof.status = "play";
//                 roof.asal = m.cht;
//                 clearTimeout(roof.waktu);
//                 m.reply({
//                     text: `Sistem telah mengirimkan pilihan kepada @${roof.p.split`@`[0]} & @${roof.p2.split`@`[0]} melalui pesan pribadi.\n\nSilahkan cek pesan pribadi sistem atau klik wa.me/${sock.user.id.split(":")[0].split`@`[0]}`,
//                     mentions: [roof.p, roof.p2],
//                 });
//                 if (!roof.pilih) m.reply(roof.p, `Silahkan Pilih Salah Satu\n\nKirim 'batu', 'gunting' atau 'kertas'`);
//                 if (!roof.pilih2) m.reply(roof.p2, `Silahkan Pilih Salah Satu\n\nKirim 'batu', 'gunting' atau 'kertas'`);

//                 roof.waktu_milih = setTimeout(() => {
//                     if (!roof.pilih && !roof.pilih2) {
//                         m.reply({
//                             text: `@${roof.p.split`@`[0]} dan @${roof.p2.split`@`[0]} Tidak Niat Bermain, Suit Dibatalkan!`,
//                             mentions: [roof.p, roof.p2],
//                         });
//                     } else if (!roof.pilih || !roof.pilih2) {
//                         win = !roof.pilih ? roof.p2 : roof.p;
//                         m.reply({
//                             text: `@${(roof.pilih ? roof.p2 : roof.p).split`@`[0]} Tidak Memilih, Suit dibatalkan!`,
//                             mentions: [roof.p2, roof.p],
//                         });
//                     }
//                     delete sock.suit[roof.id];
//                 }, roof.timeout);
//                 return;
//             }

//             let g = /gunting/i;
//             let b = /batu/i;
//             let k = /kertas/i;

//             // Deteksi pilihan pemain
//             if (!roof.pilih && roof.p == sender && (g.test(cht) || b.test(cht) || k.test(cht))) {
//                 roof.pilih = cht.toLowerCase();
//                 roof.text = g.test(cht) ? "✌️" : b.test(cht) ? "✊" : "✋";
//                 m.reply(`Kamu memilih ${roof.pilih} (${roof.text})`);
//             }

//             if (!roof.pilih2 && roof.p2 == sender && (g.test(cht) || b.test(cht) || k.test(cht))) {
//                 roof.pilih2 = cht.toLowerCase();
//                 roof.text2 = g.test(cht) ? "✌️" : b.test(cht) ? "✊" : "✋";
//                 m.reply(`Kamu memilih ${roof.pilih2} (${roof.text2})`);
//             }

//             if (roof.pilih && roof.pilih2) {
//                 clearTimeout(roof.waktu_milih);
//                 const stage = roof.pilih;
//                 const stage2 = roof.pilih2;

//                 if (b.test(stage) && g.test(stage2)) win = roof.p;
//                 else if (b.test(stage) && k.test(stage2)) win = roof.p2;
//                 else if (g.test(stage) && k.test(stage2)) win = roof.p;
//                 else if (g.test(stage) && b.test(stage2)) win = roof.p2;
//                 else if (k.test(stage) && b.test(stage2)) win = roof.p;
//                 else if (k.test(stage) && g.test(stage2)) win = roof.p2;
//                 else if (stage === stage2) tie = true;

//                 let teks;
//                 if (tie) {
//                     teks = `*Hasil Suit:* SERI!\n` +
//                         `@${roof.p.split('@')[0]} (${roof.text}) vs @${roof.p2.split('@')[0]} (${roof.text2})`;
//                 } else {
//                     const winner = win;
//                     const loser = win === roof.p ? roof.p2 : roof.p;
//                     const winnerChoice = win === roof.p ? roof.text : roof.text2;
//                     const loserChoice = win === roof.p ? roof.text2 : roof.text;

//                     teks = `*Hasil Suit:* @${winner.split('@')[0]} Menang!\n\n` +
//                         `${winnerChoice} vs ${loserChoice}\n\n` +
//                         `Mengalahkan @${loser.split('@')[0]}`;
//                 }

//                 m.reply(roof.asal, {
//                     text: teks.trim(),
//                     mentions: [roof.p, roof.p2],
//                 });

//                 delete sock.suit[roof.id];
//             }
//         }
//     },
// };
