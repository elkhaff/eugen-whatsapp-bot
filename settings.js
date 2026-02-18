const fs = require("node:fs");

/**
 * @type {Object}
 * GLOBAL CONFIGURATION
 * Segala pengaturan utama bot diatur di sini.
 */
const config = {
  // -- Identity & Ownership --
  owner: ["6289652552565"], // Nomor owner (moderator utama bot)
  botName: "Eugen V3.1", // Nama Bot yang akan muncul di menu
  name: "PrinzXz", // Nama Owner / Branding
  
  // -- Interaction --
  prefix: [".", "?", "!", "/"], // Kumpulan simbol awalan perintah |JANGAN DI UBAH|
  noPrefix: true, // Mengaktifkan penggunaan command tanpa prefix
  
  // -- Metadata Sticker --
  sticker: {
    packname: "EugenV3.1", // Nama paket stiker
    author: "PX - Team", // Nama pembuat stiker
  },
  
  // -- Official Links/IDs --
  id: {
    newsletter: "120363388655497053@newsletter", // ID Saluran WhatsApp
    group: "120363370515588374@g.us" // ID Grup Official
  },
  
  // -- API Service --
  api: {
    base: "https://anabot.my.id",
    key: "-"
  },
  
  // -- Global Response Messages --
  messages: {
    wait: "_*Mohon tunggu, Sedang diproses...*_",
    limit: "*_Limit penggunaan telah tercapai!_*\n\n- Limit akan diatur ulang pada pukul 4 pagi.\n\n> _Tingkatkan ke versi premium untuk menikmati limit tanpa batas._",
    owner: "> 🧑‍💻 *Fitur ini hanya untuk pemilik bot*... Maaf, Anda tidak memiliki akses ke fitur ini.",
    premium: "> 🥇 *Upgrade ke Premium* untuk mendapatkan akses ke fitur eksklusif, murah dan cepat! Hubungi admin untuk info lebih lanjut.",
    group: "> 👥 *Fitur ini hanya tersedia di grup*... Pastikan Anda berada di grup WhatsApp untuk mengakses fitur ini.",
    admin: "> ⚠️ *Anda harus menjadi admin grup* untuk menggunakan fitur ini, karena bot memerlukan hak akses admin.",
    botAdmin: "> 🛠️ *Jadikan EugenV3.1 sebagai admin* grup untuk menggunakan fitur ini. Pastikan Anda memberikan hak admin kepada bot.",
  },
  
  // -- Database & Localization --
  database: "./basisdata", // Path file untuk database SQLite
  sessions: "./basisdata/session.sqlite", // Path file untuk session SQLite
  tz: "Asia/Jakarta", // Zona waktu (Timezone)
  thumbnail: "https://files.catbox.moe/l7hsrw.jpg", // Gambar utama link preview
  channelUrl: "https://whatsapp.com/channel/0029VaAaGvOJkK7AJylXyz2D", // Link saluran WhatsApp
};

module.exports = config;

/**
 * AUTO UPDATE CONFIG
 * Kode di bawah ini mendeteksi perubahan pada file config.js secara realtime.
 */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update ${__filename}`);
  delete require.cache[file];
  require(file);
});