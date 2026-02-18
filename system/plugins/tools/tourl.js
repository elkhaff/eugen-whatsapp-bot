class Command {
  constructor() {
    this.command = "tourl";
    this.alias = ["upload"];
    this.category = ["tools"];
    this.settings = {
      limit: true,
    };
    this.description = "Ubah media menjadi link dengan cepat dan mudah!";
  }

  run = async (m, { Uploader, Func, config }) => {
    let target = m.quoted ? m.quoted : m;
    if (!target.msg.mimetype) return m.reply("⚠️ *Oops!* Harap kirim atau balas media (gambar/video) yang ingin diubah menjadi tautan.");

    await m.reply(config.messages.wait);

    let buffer = await target.download();
    let url = await Uploader.catbox(buffer);

    let caption = `✨ *Media to URL Uploader* ✨\n\n`;
    caption += `📂 *Ukuran media:* ${Func.formatSize(buffer.length)}\n`;
    caption += `🔗 *Tautan hasil:* ${url}\n\n`;
    caption += `💡 *Tips:* Gunakan fitur ini untuk berbagi media dengan lebih mudah tanpa perlu mengunggah ulang.`;

    m.reply(caption);
  };
}

module.exports = new Command();
