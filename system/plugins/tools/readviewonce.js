const baileys = require('baileys')

module.exports = {
    command: "readviewonce",
    alias: ["rvo"],
    category: ["tools"],
    settings: {
        limit: true,
    },
    description: "Mengirim ulang pesan view once",
    async run(m, {
        sock
    }) {
        if (!m.quoted || !m.quoted.msg.viewOnce) return m.reply('Reply pesan view once.')

        let msg = m.quoted.message
        let type = Object.keys(msg)[0]
        let buffer = await sock.downloadM(msg[type], type == 'imageMessage' ? 'image' : type == 'videoMessage' ? 'video' : 'audio')
        if (!buffer || buffer.length === 0) return m.reply('Media tidak ditemukan atau tidak dapat diunduh.')

        if (/video/.test(type)) {
            return m.reply({
                video: buffer,
                caption: msg[type].caption || ''
            })
        } else if (/image/.test(type)) {
            return m.reply({
                image: buffer,
                caption: msg[type].caption || ''
            })
        } else if (/audio/.test(type)) {
            return m.reply({
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: true
            })
        }
    }
}