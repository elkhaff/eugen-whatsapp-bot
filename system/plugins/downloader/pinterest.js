module.exports = {
  command: "pinterest",
  alias: ["pin", "pindl"],
  category: ["downloader", "search"],
  description: "Mencari atau mengunduh media dari Pinterest!",
  settings: {
    limit: 3,
  },
  async run(m, { sock, Func, Scraper, text }) {
    if (!text) return m.reply("> *Masukkan query atau link dari Pinterest!*");

    if (Func.isUrl(text)) {
      if (!/pinterest.com|pin.it/.test(text)) return m.reply("> *Masukkan link Pinterest yang valid!*");
      let data = await Scraper.pinterest.download(text);
      let cap = "*[ Pinterest - Downloader ]*\n";
      cap += `- *Title:* ${data.title}\n`;
      cap += `- *Keyword:* ${data.keyword.join(", ")}\n`;
      cap += `- *Author:* ${data.author.name}\n`;

      sock.sendFile(m.cht, data.download, null, cap, m);
    } else {
      let data = await Scraper.pinterest.search(text);
      let result = data.getRandom();
      let caption = "*[ Pinterest - Search ]*\n";
      caption += Object.entries(result)
        .map(([a, b]) => `- *${a.capitalize()}:* ${b}`)
        .join("\n");

      m.reply({
        image: {
          url: result.image,
        },
        caption,
      });
    }
  }
};