const axios = require('axios');

const proxyList = [
  {
    "host": "81.177.48.54",
    "port": 2080
  },
  {
    "host": "59.153.100.98",
    "port": 80
  },
  {
    "host": "81.70.169.194",
    "port": 80
  },
  {
    "host": "178.212.144.7",
    "port": 80
  },
  {
    "host": "185.187.92.42",
    "port": 80
  },
  {
    "host": "101.43.255.96",
    "port": 80
  },
  {
    "host": "165.227.5.10",
    "port": 8888
  },
  {
    "host": "46.62.204.83",
    "port": 80
  },
  {
    "host": "195.231.69.203",
    "port": 80
  },
  {
    "host": "103.125.31.222",
    "port": 80
  }
]

async function LaraTranslate(text, targetLang, sourceLang = '') {
    const url = 'https://webapi.laratranslate.com/translate/segmented';

    const headers = {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'origin': 'https://app.laratranslate.com',
        'referer': 'https://app.laratranslate.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'x-lara-client': 'Webapp',
    };

    const payload = {
        q: text,
        source: sourceLang,
        target: targetLang,
        "style": "faithful",
        "content_type": "text/plain"
    };

    const shuffledProxies = [...proxyList].sort(() => 0.5 - Math.random());

    for (const proxy of shuffledProxies) {
        try {
            console.log(`Attempting translation via proxy: ${proxy.host}:${proxy.port}`);

            const response = await axios.post(url, payload, {
                headers,
                proxy: {
                    protocol: 'http',
                    host: proxy.host,
                    port: proxy.port
                },
                timeout: 10000
            });

            const data = response.data;

            if (data && data.status === 200 && data.content && Array.isArray(data.content.translations)) {
                console.log('Translation successful.');
                return data;
            } else {
                throw new Error('Invalid response structure received from proxy');
            }
        } catch (error) {
            const errorMessage = error.response ? `Status ${error.response.status}` : error.message;
            console.error(`Proxy ${proxy.host}:${proxy.port} failed: ${errorMessage}`);
        }
    }

    throw new Error('All proxies failed to translate the text.');
}

module.exports = { LaraTranslate };