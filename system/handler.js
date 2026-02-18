const config = require("../settings.js");
const Func = require("../lib/function.js");
const Uploader = require("../lib/uploader.js");
const moment = require("moment-timezone");
const chalk = require("chalk");

module.exports = async (m, sock, db, pg, scraper) => {
  require("../lib/logger.js")(m, pg);
  // if (m.key.remoteJid === "status@broadcast") {
  //   await sock.readMessages([m.key]);
  //   console.log(chalk.green.bold("– 📸 Membaca Status WhatsApp dari: " + m.pushName));
  //   return;
  // }

  await db.main(m);
  // db.list().user[m.sender].name = m.pushName;

  if (m.isBot) return;
  if (db.list().settings.self && !m.isOwner) return;
  if (db.list().user[m.sender].banned) return;
  if (db.list().settings.chatMode === "private" && m.isGroup) return;

  const isSuitAllowed = sock.suit && Object.values(sock.suit).some(r => [r.p, r.p2].includes(m.sender));
  if (db.list().settings.chatMode === "group" && !(m.isGroup || m.command === "wwpc" || isSuitAllowed)) return;

  const isAdmin = m.isAdmin;
  const botAdmin = m.isBotAdmin;
  const Scraper = await scraper.list();
  const usedPrefix = config.prefix.includes(m.prefix);
  const text = m.text;

  for (const name in pg.plugins) {
    const plugin = pg.plugins[name];
    if (typeof plugin?.events === "function") {
      try {
        plugin.events.call(sock, m, {
          sock, Func, config, Uploader, pg, db, Scraper, text,
          plugins: Object.values(pg.plugins).filter(p => p.alias),
          isAdmin, botAdmin
        });
      } catch (e) {
        console.error(`Error plugin.events di ${name}:`, e);
      }
    }
  }

  if (m.isGroup && db.list().group[m.cht]?.mute && !(isAdmin || m.isOwner)) return;

  for (const name in pg.plugins) {
    const plugin = pg.plugins[name];
    if (typeof plugin?.run !== "function") continue;

    const cmd = usedPrefix && (
      m.command.toLowerCase() === plugin.command ||
      plugin.alias?.includes(m.command.toLowerCase())
    );

    if (!cmd) continue;

    if (!db.list().stats[name]) {
      db.list().stats[name] = {
        total: 0, success: 0, error: 0, last: null, lastSuccess: null, daily: {}
      };
    }
    const today = moment().format("YYYY-MM-DD");
    if (!db.list().stats[name].daily[today]) {
      db.list().stats[name].daily[today] = { total: 0, success: 0, error: 0 };
    }

    if (m.args[0] === "-i") {
      const no = 1;
      const numberedExample = plugin.example?.replace(/\n/g, () => `\n${no++}.`);
      await m.reply(`*[ Informasi Perintah ]*\n\n> *Perintah:* ${plugin.command}\n> *Alias:* ${plugin.alias.join(', ')}\n> *Kategori:* ${plugin.category}\n> *Deskripsi:* ${plugin.description}${plugin.example ? `\n\n- *Example:* ${numberedExample}` : ``}`);
      return;
    }

    if (plugin.settings) {
      if (plugin.settings.owner && !m.isOwner) return m.reply(config.messages.owner);
      if (plugin.settings.group && !m.isGroup) return m.reply(config.messages.group);
      if (plugin.settings.admin && !isAdmin) return m.reply(config.messages.admin);
      if (plugin.settings.botAdmin && !botAdmin) return m.reply(config.messages.botAdmin);
      if (plugin.settings.limit && db.list().user[m.sender].limit < plugin.settings.limit) {
        return m.reply(config.messages.limit);
      }
    }

    db.list().stats[name].total++;
    db.list().stats[name].last = new Date().toISOString();
    db.list().stats[name].daily[today].total++;

    try {
      await plugin.run(m, {
        sock, config, text,
        plugins: Object.values(pg.plugins).filter(p => p.alias),
        Func, Scraper, Uploader, db, pg,
        isAdmin, botAdmin
      });

      if (plugin.settings?.limit && !m.isOwner) {
        const reduce = typeof plugin.settings.limit === 'number' ? plugin.settings.limit : 1;
        db.list().user[m.sender].limit -= reduce;
      }

      db.list().stats[name].success++;
      db.list().stats[name].lastSuccess = new Date().toISOString();
      db.list().stats[name].daily[today].success++;
    } catch (err) {
      db.list().stats[name].error++;
      db.list().stats[name].daily[today].error++;

      console.error("Plugin Error:", err);

      const report = `*– 📉 Error Terdeteksi*\n> *Command:* ${m.command}\n> *File:* ${name}\n\n${Func.jsonFormat(err)}`;
      for (const owner of config.owner) {
        const jid = await sock.onWhatsApp(owner + "@s.whatsapp.net");
        if (jid?.[0]?.exists) {
          await sock.sendMessage(owner + "@s.whatsapp.net", { text: report });
        }
      }

      await m.reply(Func.jsonFormat(err));
    }
  }

  if (db.list().settings.online) {
    await sock.readMessages([m.key]);
  }
};