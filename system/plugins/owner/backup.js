/*const fs = require("fs");
const archiver = require("archiver");
const moment = require("moment-timezone");

module.exports = {
    command: "backup",
    alias: ["bckp"],
    category: ["owner"],
    settings: {
        owner: true
    },
    description: "Mengambil backup source code secara manual (tanpa folder sampah).",
    async run(m, { sock, config }) {
        const timeStr = moment.tz("Asia/Jakarta").format("DDMM_HHmm");
        const fileName = `Manual_Backup_${timeStr}.zip`;
        
        m.reply("⏳ Sedang mengompres source code, mohon tunggu...");

        const output = fs.createWriteStream(fileName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
            try {
                await sock.sendMessage(m.cht, { 
                    document: fs.readFileSync(fileName), 
                    mimetype: 'application/zip', 
                    fileName: fileName,
                    caption: `*MANUAL BACKUP COMPLETED*\n\n◦ *File Name*: ${fileName}\n◦ *Size*: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB\n◦ *Time*: ${moment().format('HH:mm:ss')} WIB\n\n_Backup berhasil dikirim._`
                }, { quoted: m });
                
                fs.unlinkSync(fileName);
            } catch (e) {
                m.reply("Gagal mengirim file backup: " + e.message);
            }
        });

        archive.on('error', (err) => {
            m.reply("Error saat kompresi: " + err.message);
        });

        archive.pipe(output);

        const files = fs.readdirSync('./');
        files.forEach(file => {
            const ignore = ['node_modules', 'sessions', 'tmp', '.git', '.npm', fileName, 'package-lock.json'];
            
            if (!ignore.includes(file)) {
                const stats = fs.statSync(file);
                if (stats.isDirectory()) {
                    archive.directory(file, file);
                } else {
                    archive.file(file, { name: file });
                }
            }
        });

        await archive.finalize();
    }
};*/