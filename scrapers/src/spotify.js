const axios = require("axios");

const client_id = "acc6302297e040aeb6e4ac1fbdfd62c3";
const client_secret = "0e8439a1280a43aba9a5bc0a16f3f009";
const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

async function spotifyCreds() {
    try {
        const response = await axios.post(
            TOKEN_ENDPOINT,
            "grant_type=client_credentials", {
                headers: {
                    Authorization: "Basic " + basic
                },
            },
        );
        return {
            status: true,
            data: response.data,
        };
    } catch (error) {
        return {
            status: false,
            msg: "Failed to retrieve Spotify credentials."
        };
    }
}

const toTime = (ms) => {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

class Spotify {
    search = async (query, type = "track", limit = 20) => {
        try {
            const creds = await spotifyCreds();
            if (!creds.status) return creds;

            const response = await axios.get(
                `https://api.spotify.com/v1/search?query=${encodeURIComponent(query)}&type=${type}&offset=0&limit=${limit}`, {
                    headers: {
                        Authorization: "Bearer " + creds.data.access_token
                    },
                },
            );

            if (
                !response.data[type + "s"] ||
                !response.data[type + "s"].items.length
            ) {
                return {
                    msg: "Music not found!"
                };
            }

            return response.data[type + "s"].items.map((item) => ({
                title: item.name,
                id: item.id,
                duration: toTime(item.duration_ms),
                artist: item.artists.map((artist) => artist.name).join(" & "),
                url: item.external_urls.spotify,
            }));
        } catch (error) {
            return {
                status: false,
                msg: "Error searching for music. " + error.message,
            };
        }
    };

    download = async function spotifydl(url) {
  try {
      const download = await axios.post(`https://spotydown.media/api/download-track`, { url: url }).then(a => a.data)

       const metadata = await axios.post(`https://spotydown.media/api/get-metadata`, { url: url }).then(a => a.data.apiResponse.data[0])

       const data = {
         metadata,
         download 
       }
  
      return data
   } catch (e) {
     return { metadata: e, download: e }
   console.log(e)
   }
}
}

module.exports = new Spotify();