<div align="center">

# EUGEN BOT
**Advanced Modular WhatsApp Bot Base**

<img src="https://img.shields.io/badge/JavaScript-Node.js-yellow?style=for-the-badge&logo=javascript" />
<img src="https://img.shields.io/badge/Baileys-WhiskeySockets-blue?style=for-the-badge&logo=whatsapp" />
<img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" />

<p>
  <a href="#-fitur-unggulan">Fitur</a> •
  <a href="#-instalasi">Instalasi</a> •
  <a href="#-konfigurasi">Konfigurasi</a> •
  <a href="#-panduan-pengembang">Panduan Dev</a> •
</p>

</div>

---

## 📖 Deskripsi

**Eugen Bot** adalah bot WhatsApp berbasis Node.js yang dibangun menggunakan library `@whiskeysockets/baileys`. Project ini dirancang dengan arsitektur **modular** yang bersih, memudahkan pengembang untuk menambah fitur tanpa merusak inti sistem.

Bot ini dilengkapi dengan **Custom Logger** profesional, integrasi **AI Persona** (Eugen), dan penanganan pesan interaktif (Native Flow) yang modern.

## ✨ Fitur Unggulan

* 🧩 **Sistem Plugin Modular**: Menambah fitur semudah membuat satu file `.js`.
* 🎨 **Professional Logger**: Log aktivitas berwarna, rapi, dan mendukung Timezone Asia/Jakarta.
* 🤖 **AI Integration**: Terintegrasi dengan Ollama/Gemma (Persona Eugen).
* 📱 **Group Utilities**: Manajemen grup lengkap (Kick, Hidetag, Group Story).
* 🔍 **Media Search**: Pencarian Pixiv, Channel Info (metadata), dan Tools.
* ⚡ **Interactive Messages**: Mendukung Button, Carousel, dan Copy Code native.

---

## 📥 Instalasi

Pastikan sistem Anda telah terinstall **Node.js** (v18+) dan **FFmpeg**.

1.  **Clone Repository**
    ```bash
    git clone https://github.com/PrinzXz/eugen-whatsapp-bot.git
    cd eugen-whatsapp-bot
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Jalankan Bot**
    ```bash
    npm start
    ```

---

## ⚙️ Konfigurasi

Sesuaikan pengaturan bot di file `config.js` sebelum menjalankan:

```javascript
module.exports = {
    // Pengaturan Owner
    owner: ["6281234567890@s.whatsapp.net"],
    name: "Nama Owner",
    botName: "Eugen Bot",
    
    // Sesi & Sistem
    sessionName: "session",
    footer: "Eugen System V3",
    
    // API Configuration
    api: {
        base: "https://api.example.com",
        key: "YOUR_API_KEY"
    },
    
    // Custom Messages
    messages: {
        wait: "⏳ Sedang diproses...",
        done: "✅ Selesai!",
        error: "❌ Terjadi kesalahan pada sistem.",
        owner: "⚠️ Fitur ini khusus Owner!",
        group: "⚠️ Fitur ini hanya untuk Grup!"
    }
};
```

---

## 💻 Panduan Pengembang

Bot ini menggunakan sistem plugin dinamis. Semua fitur disimpan di dalam folder system/plugins/.

1. Struktur Folder
Berikut adalah hierarki folder untuk plugin:
```
.
├── system/
│   ├── plugins/        # 📂 FOLDER UTAMA PLUGIN
│   │   ├── ai/         # Fitur AI (gpt.js, eugen.js)
│   │   ├── group/      # Fitur Grup (kick.js, hidetag.js)
│   │   ├── info/       # Fitur Info (ping.js, owner.js)
│   │   └── tools/      # Tools & Search
│   └── ...
├── lib/                # Library pendukung
├── config.js           # Konfigurasi
└── index.js            # File utama
```

2. Contoh Implementasi Plugin
Untuk membuat fitur baru, cukup buat file .js baru di dalam salah satu folder plugin (misalnya system/plugins/info/ping.js).

Gunakan template standar berikut:
```
module.exports = {
    // Nama command utama
    command: "ping",
    
    // Alias command (opsional)
    alias: ["p", "speed"],
    
    // Kategori menu
    category: ["info"],
    
    // Pengaturan Permission (Opsional)
    settings: {
        owner: false,    // Set true jika hanya untuk owner
        group: false,    // Set true jika hanya untuk grup
        admin: false,    // Set true jika hanya untuk admin
        botAdmin: false, // Set true jika bot harus jadi admin
    },
    
    // Deskripsi fitur yang muncul di menu
    description: "Cek kecepatan respon bot",
    
    // Fungsi utama yang dijalankan
    async run(m, { sock, text, args, config, Func }) {
        // m      : Objek pesan (reply, sender, chat id, dll)
        // sock   : Socket Baileys (sendMessage, groupMetadata, dll)
        // text   : Input user tanpa prefix (contoh: 'halo')
        // config : Data dari config.js
        
        // Logika kode:
        const start = Date.now();
        await m.reply("Pong!"); // Mengirim balasan
        
        const latency = Date.now() - start;
        // Mengirim pesan susulan
        await sock.sendMessage(m.chat, { text: `Kecepatan: ${latency}ms` }, { quoted: m });
    }
};
```
