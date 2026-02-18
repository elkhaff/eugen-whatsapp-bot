const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');

async function downloadUpscaledVideo(url) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'Referer': 'https://www.videotoconvert.com/upscale/', // atau referer sumber form upload
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                'Accept': '*/*'
            }
        });

        return Buffer.from(res.data);
    } catch (e) {
        throw new Error(`Gagal download buffer: ${e.message}`);
    }
}

class MediaUpscaler {
    constructor() {
        this.imageHeaders = {
            origin: 'https://imglarger.com',
            referer: 'https://imglarger.com/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0'
        };

        this.videoHeaders = {
            Origin: 'https://www.videotoconvert.com',
            Referer: 'https://www.videotoconvert.com/upscale/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0'
        };

        this.videoScaleOptions = {
            HD: '1280x720',
            FHD: '1920x1080',
            '2K': '2560x1440',
            '4K': '3840x2160'
        };
    }

    image = async function image(filePath, scaleRadio = 2) {
        const form = new FormData();
        form.append('file', filePath, { filename: 'image.jpg' });
        form.append('type', '13');
        form.append('scaleRadio', scaleRadio);

        const headers = {
            ...form.getHeaders(),
            ...this.imageHeaders
        };

        try {
            const res = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', form, { headers });
            const { code, data, msg } = res.data;

            if (code !== 200) throw new Error(`Upload gagal: ${msg}`);
            const imageCode = data.code;

            while (true) {
                const statusRes = await axios.post(
                    'https://photoai.imglarger.com/api/PhoAi/CheckStatus',
                    { code: imageCode, type: data.type },
                    {
                        headers: {
                            'content-type': 'application/json',
                            ...this.imageHeaders
                        }
                    }
                );

                const resData = statusRes.data?.data;
                console.log(resData);
                if (resData?.status === 'success') return resData;

                await new Promise(r => setTimeout(r, 3000));
            }
        } catch (e) {
            throw new Error(`UpscaleImage Error: ${e.message}`);
        }
    }

    video = async function video(filePath, scaleLabel = 'HD') {
        const scale = this.videoScaleOptions[scaleLabel] || this.videoScaleOptions['HD'];
        const form = new FormData();
        form.append('upfile', filePath, { filename: 'video.mp4' });
        form.append('upscale', scale);
        form.append('submitfile', '1');

        const headers = {
            ...form.getHeaders(),
            ...this.videoHeaders
        };

        try {
            const res = await axios.post('https://www.videotoconvert.com/upscale/', form, {
                headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            const $ = cheerio.load(res.data);
            const alert = $('.alert-success');

            if (!alert.length) throw new Error('Upscaling failed or result not found.');

            const url = alert.find('a[href*="download.php"]').attr('href');
            const sizeMatch = alert.text().match(/\(([\d.]+MB)\)/);

            return {
                url: url || null,
                buffer: (await downloadUpscaledVideo(url)) || null,
                size: sizeMatch ? sizeMatch[1] : null
            };
        } catch (err) {
            throw new Error(`UpscaleVideo Error: ${err.message}`);
        }
    }
}

module.exports = new MediaUpscaler();