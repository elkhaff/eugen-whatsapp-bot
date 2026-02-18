module.exports = {
    command: "instagram",
    alias: ["igdl", "ig", "igvideo", "igreel"],
    category: ["downloader"],
    settings: {
        limit: 3,
    },
    description: "Mengunduh Reels/postingan Instagram",
    async run(m, {
        sock,
        Func,
        text,
        Scraper,
        config
    }) {
        if (!text) return m.reply(`*– 乂 Cara Penggunaan :*
> *Masukkan atau balas pesan dengan link Instagram yang ingin diunduh*
> *Contoh :* ${m.prefix + m.command} https://www.instagram.com/reel/xxxxx/

*– 乂 Petunjuk :*
> Link yang valid hanya bisa berupa Postingan atau Reels dari Instagram.`);

        if (!/instagram.com/.test(text)) return m.reply("*– 乂 Masukkan Link Instagram yang Valid :*\n> Pastikan link yang dimasukkan berasal dari Instagram.");
        
        await m.reply(config.messages.wait);

        let data = await Scraper.Instagram(text);
        if (!data) return;
        let caption = `   – Instagram - Downloader\n`;
        caption += `- Username: ${data.metadata.username || ""}\n`;
        caption += `- Like: ${data.metadata.like || ""}\n`;
        caption += `- Comment: ${data.metadata.comment || ""}\n`;
        caption += `- Type: ${data.metadata.isVideo ? "Video" : "Image" || ""}\n`;
        caption += `- caption: ${data.metadata.caption || ""}\n`;
        if (data.url.length >= 1 && data.url.length <= 2) {
            let res = await fetch(data.url[0]);
            sock.sendFile(m.cht, Buffer.from(await res.arrayBuffer()), null, caption, m);
        } else {
            const media = await Promise.all(data.url.map(async (url) => {
                let res = await fetch(url);
                let contentType = res.headers.get('Content-Type');

                let mediaType = contentType.includes("image") ? "image" : contentType.includes("video") ? "video" : null;

                if (mediaType) {
                    let mediaData = {
                        type: mediaType,
                        data: {
                            url
                        }
                    };
                    return mediaData;
                } else {
                    // Bisa tambahkan logika untuk menangani jenis file selain image atau video
                    console.log(`Unsupported media type: ${url}`);
                    return null;
                }
            }));
            // Filter untuk menghilangkan data null
            const validMedia = media.filter(item => item !== null);

            // Kirim album pesan jika ada media yang valid
            if (validMedia.length > 0) {
                // await m.reply(caption);
                await sock.sendAlbumMessage(m.cht, validMedia, {
                    text: caption,
                    quoted: m,
                    delay: 3
                });
            }
        }

    },
};