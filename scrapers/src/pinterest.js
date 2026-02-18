const axios = require("axios");
const cheerio = require("cheerio");

async function getCookies() {
    try {
        const response = await axios.get('https://www.pinterest.com/csrf_error/');
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders) {
            const cookies = setCookieHeaders.map(cookieString => {
                const cookieParts = cookieString.split(';');
                const cookieKeyValue = cookieParts[0].trim();
                return cookieKeyValue;
            });
            return cookies.join('; ');
        } else {
            console.warn('No set-cookie headers found in the response.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching cookies:', error);
        return null;
    }
}

class Pinterest {
    search = async function(query) {
        try {
            const cookies = await getCookies();
            if (!cookies) {
                console.log('Failed to retrieve cookies. Exiting.');
                return;
            }

            const url = 'https://www.pinterest.com/resource/BaseSearchResource/get/';

            const params = {
                source_url: `/search/pins/?q=${query}`, // Use encodedQuery here
                data: JSON.stringify({
                    "options": {
                        "isPrefetch": false,
                        "query": query,
                        "scope": "pins",
                        "no_fetch_context_on_resource": false
                    },
                    "context": {}
                }),
                _: Date.now()
            };

            const headers = {
                'accept': 'application/json, text/javascript, */*, q=0.01',
                'accept-encoding': 'gzip, deflate',
                'accept-language': 'en-US,en;q=0.9',
                'cookie': cookies,
                'dnt': '1',
                'referer': 'https://www.pinterest.com/',
                'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
                'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Microsoft Edge";v="133.0.3065.92", "Chromium";v="133.0.6943.142"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-platform-version': '"10.0.0"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
                'x-app-version': 'c056fb7',
                'x-pinterest-appstate': 'active',
                'x-pinterest-pws-handler': 'www/[username]/[slug].js',
                'x-pinterest-source-url': '/hargr003/cat-pictures/',
                'x-requested-with': 'XMLHttpRequest'
            };

            const {
                data
            } = await axios.get(url, {
                headers: headers,
                params: params
            })

            const container = [];
            const results = data.resource_response.data.results.filter((v) => v.images?.orig);
            results.forEach((result) => {
                container.push({
                    upload_by: result.pinner.username,
                    fullname: result.pinner.full_name,
                    followers: result.pinner.follower_count,
                    caption: result.grid_title,
                    image: result.images.orig.url,
                    source: "https://id.pinterest.com/pin/" + result.id,
                });
            });

            return container;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
    download = async function(url) {
        try {
            let response = await axios
                .get(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                    },
                })
                .catch((e) => e.response);
            let $ = cheerio.load(response.data);
            let tag = $('script[data-test-id="video-snippet"]');
            if (tag.length > 0) {
                let result = JSON.parse(tag.text());
                if (
                    !result ||
                    !result.name ||
                    !result.thumbnailUrl ||
                    !result.uploadDate ||
                    !result.creator
                ) {
                    return {
                        msg: "- Data tidak ditemukan, coba pakai url lain"
                    };
                }
                return {
                    title: result.name,
                    thumb: result.thumbnailUrl,
                    upload: new Date(result.uploadDate).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                    }),
                    source: result["@id"],
                    author: {
                        name: result.creator.alternateName,
                        username: "@" + result.creator.name,
                        url: result.creator.url,
                    },
                    keyword: result.keywords ?
                        result.keywords.split(", ").map((keyword) => keyword.trim()) : [],
                    download: result.contentUrl,
                };
            } else {
                let json = JSON.parse($("script[data-relay-response='true']").eq(0).text());
                let result = json.response.data["v3GetPinQuery"].data;
                return {
                    title: result.title,
                    upload: new Date(result.createAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                    }),
                    source: result.link,
                    author: {
                        name: result.pinner.username,
                        username: "@" + result.pinner.username,
                    },
                    keyword: result.pinJoin.visualAnnotation,
                    download: result.imageLargeUrl,
                };
            }
        } catch (e) {
            return {
                msg: "Error coba lagi nanti"
            };
        }
    };
}

module.exports = new Pinterest();