module.exports = {
    command: "groupsetting",
    alias: ["gcsetting", "group", "grup", "gc"],
    category: ["group"],
    settings: {
        group: true,
        admin: true,
        botAdmin: true,
    },
    description: "Mengatur Akses Grup: Membuka/Tutup Grup",
    async run(m, {
        sock,
        text
    }) {
        const query = text.split(" ");
        if (/^(open|o|unlock|buka|close|c|lock|tutup)/i.test(query[0])) {
            if (/^(open|o|unlock|buka)/i.test(query[0])) {
                if (query[1] && query[2] && query[2].match(/(detik|menit|jam|hari)/i)) {
                    let time = parseInt(query[1]);
                    if (isNaN(time) || time <= 0) {
                        return m.reply("Waktu harus berupa angka positif.");
                    }

                    let unit = query[2].toLowerCase();
                    let timer;

                    switch (unit) {
                        case "detik":
                            timer = time * 1000;
                            break;
                        case "menit":
                            timer = time * 60 * 1000;
                            break;
                        case "jam":
                            timer = time * 60 * 60 * 1000;
                            break;
                        case "hari":
                            timer = time * 24 * 60 * 60 * 1000;
                            break;
                        default:
                            return m.reply("Satuan waktu yang valid: detik, menit, jam, hari.");
                    }

                    m.reply(`Grup akan dibuka setelah ${query[1]} ${query[2]}.`);
                    setTimeout(() => {
                        sock.groupSettingUpdate(m.cht, "not_announcement");
                        m.reply("Grup telah dibuka untuk semua peserta.");
                    }, timer);
                } else {
                    sock.groupSettingUpdate(m.cht, "not_announcement").then(() => {
                        m.reply("Grup telah dibuka untuk semua peserta tanpa jeda.");
                    });
                }
            } else if (/^(close|c|lock|tutup)/i.test(query[0])) {
                if (query[1] && query[2] && query[2].match(/(detik|menit|jam|hari)/i)) {
                    let time = parseInt(query[1]);
                    if (isNaN(time) || time <= 0) {
                        return m.reply("Waktu harus berupa angka positif.");
                    }

                    let unit = query[2].toLowerCase();
                    let timer;

                    switch (unit) {
                        case "detik":
                            timer = time * 1000;
                            break;
                        case "menit":
                            timer = time * 60 * 1000;
                            break;
                        case "jam":
                            timer = time * 60 * 60 * 1000;
                            break;
                        case "hari":
                            timer = time * 24 * 60 * 60 * 1000;
                            break;
                        default:
                            return m.reply("Satuan waktu yang valid: detik, menit, jam, hari.");
                    }

                    m.reply(`Grup akan ditutup setelah ${query[1]} ${query[2]}.`);
                    setTimeout(() => {
                        m.reply("Grup telah ditutup, hanya admin yang dapat mengirim pesan.");
                    }, timer);
                } else {
                    sock.groupSettingUpdate(m.cht, "announcement").then(() => {
                        m.reply("Grup telah ditutup, hanya admin yang dapat mengirim pesan.");
                    });
                }
            }
        } else {
            m.reply(`Format yang benar:\n${m.prefix + m.command} [(open/buka/unlock)/(close/tutup/lock)] [waktu] [detik/menit/jam/hari]`);
        }
    },
};