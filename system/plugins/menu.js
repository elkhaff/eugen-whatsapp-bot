const moment = require("moment-timezone");
const pkg = require(process.cwd() + "/package.json");
const axios = require("axios");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  command: "menu",
  alias: ["help"],
  category: ["main"],
  description: "Displays the bot menu",
  async run(m, { sock, plugins, config, Func, db }) {
    let menu = {};

    plugins.forEach((item) => {
      if (item.category && item.command && !item.category.includes("hide")) {
        item.category.forEach((cat) => {
          if (!menu[cat]) {
            menu[cat] = [];
          }
          menu[cat].push(item.command);
        });
      }
    });

    let sortedCategories = Object.keys(menu).sort();
    let sortedMenu = sortedCategories.map((cat) => {
      let sortedCommands = menu[cat].sort();
      return `*${cat.toUpperCase()}*\n` + sortedCommands.map((cmd, i) => `${i + 1}. ${m.prefix}${cmd}`).join("\n");
    }).join("\n\n");

    let teks = `*${config.name}*\n\n` +
      `> *RAM Used* : ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\n` +
      `> *Total Users* : ${Object.keys(db.list().user).length} Users\n` +
      `> *Total Groups* : ${Object.keys(db.list().group).length} Groups\n` +
      `> *Total Features* : ${plugins.length}\n` +
      `> *Total Categories* : ${sortedCategories.length}\n` +
      `> *Uptime* : ${Func.toDate(process.uptime() * 1000)}\n\n` +
      sortedMenu;

    m.reply({
      text: teks,
      contextInfo: {
        mentionedJid: sock.parseMention(teks),
        // externalAdReply: {
        //   title: config.name,
        //   body: "👨‍💻 WhatsApp Bot - Project",
        //   mediaType: 1,
        //   sourceUrl: config.channelUrl,
        //   thumbnailUrl: config.thumbnail,
        //   renderLargerThumbnail: true,
        // },
      },
    });
  }
};