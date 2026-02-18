module.exports = {
  command: "totag",
  alias: [],
  category: ["group"],
  description: "Tag semua anggota dengan mengutip pesan (teks/media)",
  async run(m, { sock }) {
    if (!m.quoted) return m.reply("Balas pesan yang ingin di-tag.");

    const metadata = await m.metadata;
    const members = metadata.participants.map(p => p.id);

    await m.reply({ forward: m.quoted, mentions: members });
  },
};
