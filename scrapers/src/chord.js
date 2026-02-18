const axios = require("axios");
const cheerio = require("cheerio");

class Chords {
    search = async (query) => {
        try {
            const {
                data
            } = await axios.get(`https://www.gitagram.com/index.php?cat=&s=${encodeURIComponent(query)}`);
            const $ = cheerio.load(data);

            let results = [];
            $("table.table tbody tr")
                .each((index, element) => {
                    let title = $(element)
                        .find("span.title.is-6")
                        .text()
                        .trim();
                    let artist = $(element)
                        .find("span.subtitle.is-6")
                        .text()
                        .replace("&#8227; ", "")
                        .trim();
                    let link = $(element)
                        .find("a")
                        .attr("href");
                    let type = $(element)
                        .find("span.title.is-7")
                        .text()
                        .trim();

                    results.push({
                        title,
                        artist,
                        link,
                        type
                    });
                });

            return results;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    }

    detail = async (uri) => {
        try {
            const {
                data
            } = await axios.get(uri);
            const $ = cheerio.load(data);

            let title = $("h1.title.is-5")
                .text()
                .trim();
            let artist = $("div.subheader a span.subtitle")
                .text()
                .replace("‣", "")
                .trim();
            let artistProfileLink = $("div.subheader a")
                .attr("href");
            let artistImage = $("figure.image img")
                .attr("src");
            let date = $("span.icon-text span:contains('June')")
                .text()
                .trim();

            let chords = [];
            $("div.content pre")
                .each((index, element) => {
                    chords.push($(element)
                        .text()
                        .trim());
                });

            let formattedChords = chords.join("\n")
                .replace(/\\n/g, "\n")
                .replace(/\s+\+/g, "")
                .replace(/\s*[A-G][#bm]?\s*/g, "");


            return {
                title,
                artist,
                artistProfileLink: `https://www.gitagram.com${artistProfileLink}`,
                artistImage,
                date,
                chords: chords.join("\n")
            };
        } catch (error) {
            console.error("Error fetching details:", error);
            return null;
        }
    }
}

module.exports = new Chords();