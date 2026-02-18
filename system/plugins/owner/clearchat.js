class Command {
  constructor() {
    this.command = "clearchat";
    this.alias = [];
    this.category = ["owner"];
    this.settings = { owner: true };
    this.description = "Membersihkan semua pesan di grup";
  }

  run = async (m, { sock }) => {
    await m.reply(config.messages.wait);
    const groupIds = Object.keys(sock.groupData);
    if (groupIds.length === 0) {
      return m.reply(`*Tidak ada grup ditemukan untuk membersihkan pesan.*`);
    }
    let successCount = 0;
    for (let id of groupIds) {
      try {
        await sock.clearMessage(id, m.key, m.timestamps);
        successCount++;
      } catch (err) {
        console.error(`❌ Gagal membersihkan chat grup ${id}:`, err.message);
      }
    }

    m.reply(
      `*╭──[ 乂 CLEAR CHAT - GRUP ]*
᎒⊸ Total Grup: *${groupIds.length}*
᎒⊸ Berhasil Dibersihkan: *${successCount}*
*✔️ Semua pesan di grup berhasil dibersihkan!*
*╰────────────•*`,
    );
  };
}

module.exports = new Command();
