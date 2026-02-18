const { writeExif } = require(process.cwd() + "/lib/sticker");
const axios = require('axios');

module.exports = {
    command: "sticker",
    alias: ["s"],
    category: ["sticker"],
    settings: { limit: 3 },
    description: "Convert media to sticker",
    async run(m, { sock, text, config, Func }) {
    const quoted = m.isQuoted ? m.quoted : m;
        if (/image|video|webp/.test(quoted.msg.mimetype)) {
            let media = await quoted.download();
            if (quoted.msg?.seconds > 10) return m.reply("> Video lebih dari 10 detik tidak dapat dijadikan sticker.");

            let exif;
            if (text) {
                let [packname, author] = text.split(/[,|\-+&]/);
                exif = {
                    packName: packname ? packname : "",
                    packPublish: author ? author : "",
                };
            } else {
                exif = {
                    packName: config.sticker.packname,
                    packPublish: config.sticker.author,
                };
            }

            let sticker = await writeExif({
                mimetype: quoted.msg.mimetype,
                data: media
            }, exif);

            await m.reply({ sticker });
        } else if (m.mentions.length !== 0) {
            for (let id of m.mentions) {
                await Func.delay(1500);
                let url = await sock.profilePictureUrl(id, "image");
                let media = await axios
                    .get(url, {
                        responseType: "arraybuffer",
                    })
                    .then((a) => a.data);
                let sticker = await writeExif(media, {
                    packName: config.sticker.packname,
                    packPublish: config.sticker.author,
                });
                await m.reply({ sticker });
            }
        } else if (
            /(https?:\/\/.*\.(?:png|jpg|jpeg|webp|mov|mp4|webm|gif))/i.test(text)
        ) {
            for (let url of Func.isUrl(text)) {
                await Func.delay(1500);
            }
        } else {
            m.reply("> Balas dengan foto atau video untuk dijadikan sticker.");
        }
    }
}