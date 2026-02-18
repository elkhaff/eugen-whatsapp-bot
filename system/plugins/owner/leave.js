module.exports = {
  command: "leave",
  alias: [],
  category: ["owner"],
  settings: {
    owner: true,
  },
  description: "Mengeluarkan bot dari dalam grup.",
  async run(m, { sock}) {
    m.reply("Bot akan meninggalkan grup.")
    sock.groupLeave(m.cht).then(() => {}).catch((error) => {
      m.reply(`Terjadi kesalahan saat mencoba meninggalkan grup: ${error.message}`);
    });
  }
};
