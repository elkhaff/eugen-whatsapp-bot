const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');

module.exports = {
  command: "youtube-play",
  alias: ["youtubeplay", "play"],
  category: ["downloader"],
  settings: {
    limit: 3,
  },
  description: "Search and download audio from YouTube",
  async run(m, { sock, Scraper, Func, text, config }) {
    try {
      if (!text) {
        return m.reply("Please provide a search query!");
      }
      
      await m.reply(config.messages.wait)

      const info = (await Scraper.youtube.search(text))[0];
      if (!info) {
        return m.reply("No results found!");
      }
        
      let resMp3 = (await Scraper.youtube.download(info.url, "mp3"));
      let detail = await getMediaInfo(resMp3.data.result.urls)
        
      const caption = `*[ YouTube Play ]*

- ID: ${info.videoId}
- Title: ${info.title}
- URL: ${info.url}
- Size: ${detail.size}
- Bitrate: ${detail.bitRate}
- Timestamp: ${info.duration}
- Uploaded: ${info.uploaded}
- Views: ${info.views}
- Author Name: ${info.author.name}
- Author Channel: ${info.author.url}
- Description: ${info.description}

> _*Please wait, sending audio...!*_`;

      await m.reply({
        image: { url: info.thumbnail },
        caption
      });
      
      await m.reply({
        audio: {
          url: resMp3.data.result.urls
        },
        mimetype: 'audio/mpeg'
      });
    } catch (error) {
      console.error(error);
      m.reply("An error occurred while processing your request.");
    }
  },
};




/**
 * Mengambil informasi bitrate, size, dan format dari URL file audio
 * @param {string} url - URL file audio
 * @returns {Promise<Object>} - Informasi bitrate, size, format, dan kualitas audio
 */
async function getMediaInfo(url) {
    return new Promise(async (resolve, reject) => {
        try {
            let fileSize = "";
            try {
                const response = await axios.get(url);
                if (response.headers['content-length']) {
                    fileSize = `${(parseInt(response.headers['content-length']) / 1024 / 1024).toFixed(2)} MB`;
                }
            } catch (err) {
                fileSize = "N/A";
                console.warn("Gagal mengambil ukuran file dari HTTP header:", err.message);
            }

            ffmpeg.ffprobe(url, (err, metadata) => {
                if (err) return reject(err);

                const format = metadata.format || {};
                const bitRate = format.bit_rate ? parseInt(format.bit_rate) / 1000 : 0;

                let quality;
                if (bitRate <= 64) quality = "Low";
                else if (bitRate <= 128) quality = "Standard";
                else if (bitRate <= 192) quality = "Good";
                else if (bitRate <= 256) quality = "High";
                else if (bitRate <= 320) quality = "Very High";
                else quality = "Lossless / Ultra High";

                resolve({
                    url: format.filename || url,
                    format: format.format_name || "Unknown",
                    size: fileSize,
                    bitRate: `${bitRate} kbps`,
                    quality,
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}