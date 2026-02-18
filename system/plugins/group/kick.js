module.exports = {
  command: "kick",
  alias: [],
  category: ["group"],
  settings: {
    group: true,
    admin: true,
    botAdmin: true,
  },
  description: "Mengeluarkan anggota dari grup",
  async run(m, { sock, text }) {
    let userId;
    const args = m.text;

      if (m.quoted) {
        userId = m.quoted.sender;
      } else if (m.mentions && m.mentions.length > 0) {
          userId = m.mentions[0];
      } else if (args) {
          userId = args.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      } else {
         return m.reply("Input nomor yang ingin kick");
      }
      
    let user = await sock.onWhatsApp(userId);
    if (!user[0].exists) {
      return m.reply(`*Anggota Tidak Ditemukan!*\n\n> Akun WhatsApp ini tidak terdaftar atau sudah tidak aktif.`);
    }

    await sock
      .groupParticipantsUpdate(m.cht, [userId], "remove")
      .then(() => {
        m.react(`✅`);
      })
      .catch((err) => {
        m.react(`❌`);
      });
  },
};
