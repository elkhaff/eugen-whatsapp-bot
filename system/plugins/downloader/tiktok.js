const fs = require("fs");

module.exports = {
  command: "tiktok",
  alias: ["tikokdownload", "ttdl", "tt"],
  category: ["downloader"],
  description: "Download video dari URL TikTok",
  settings: {
    limit: 3,
  },
  async run(m, { sock, Func, Scraper, Uploader, text, config }) {
    if (!text.includes("tiktok")) return m.reply("Link TikTok tidak ditemukan! Masukkan link yang valid.");
    await m.reply(config.messages.wait);

    await Scraper.tiktok.download(text).then(async (a) => {
      const { id, region, title, author, duration, play_count, comment_count, share_count, download_count, play } = a;
      const teks = `*[ TikTok Downloader ]*\n\n- ID: ${id}\n- Region: ${region}\n- Username: ${author.unique_id}\n- Duration: ${duration} detik\n- Plays: ${play_count}\n- Comments: ${comment_count}\n- Shared: ${share_count}\n- Downloads: ${download_count}\n- Title: ${title}`;
        
      m.reply({ video: { url: play }, caption: teks });
    });
  }
};