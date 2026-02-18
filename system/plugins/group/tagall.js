module.exports = {
  command: "tagall",
  alias: [],
  category: ["group"],
  description: "Tag semua anggota dengan mengutip pesan (teks/media)",
  async run(m, { sock, text }) {
    const metadata = await m.metadata;
    const members = metadata.participants.map(p => p.id);

    await m.reply({
      text: text ? `@${m.cht} ${text}` : `@${m.cht}`,
      contextInfo: {
        mentionedJid: members,
        groupMentions: [{ groupSubject: "everyone", groupJid: m.cht }]
      }
    });
  },
};
