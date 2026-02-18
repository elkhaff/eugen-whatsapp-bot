module.exports = {
    command: "commandstats",
    alias: ["cmdstats"],
    category: ["main"],
    description: "Menampilkan statistik penggunaan fitur bot",
    run: async (m, { sock, config, Func, db }) => {
        try {
            let stats = db.list().stats;
            let sortedStats = Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
            
            let txt = "*「 Statistik Fitur 」*\n\n";
            sortedStats.forEach(([name, data], index) => {
                let displayName = name.split("/").pop().replace(".js", "");
                txt += `> ${index + 1}. *${displayName}*\n`;
                txt += `> - Total: ${data.total}\n`;
                txt += `> - Sukses: ${data.success}\n`;
                txt += `> - Error: ${data.error}\n`;
                txt += `> - Terakhir Digunakan: ${data.last ? formatTime(new Date(data.last)) : "Belum pernah"}\n`;
                txt += `> - Terakhir Berhasil: ${data.lastSuccess ? formatTime(new Date(data.lastSuccess)) : "Belum pernah"}\n`;
            });
            
            sock.sendMessage(m.cht, { text: txt }, { quoted: m });
        } catch (e) {
            console.error(e);
            m.reply(`Terjadi kesalahan: ${e.message}`);
        }
    }
};

function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return "Baru saja";
    if (minutes < 60) return `${minutes} menit`;
    if (hours < 24) return `${hours} jam ${minutes % 60} menit`;
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
    }).format(date);
}
