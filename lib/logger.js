const log = require("./logs.js");

module.exports = (m, pg) => {
    const sender = m.pushName || m.sender.split("@")[0];
    const location = m.isGroup 
        ? `${m.metadata?.subject || "Unknown Group"} (${m.cht})` 
        : `Private Chat`;
    const plugin = getPluginName(m.command, pg.plugins);

    if (m.command && plugin !== "Unknown") {
        const cmdName = m.prefix + m.command;
        
        log.cmd(`[ ${sender} ] exec ${cmdName} in ${location} [${plugin}]`);
        
    } else {
        let body = (m.body || m.type || "").replace(/\n/g, " ");
        if (body.length > 50) body = body.substring(0, 50) + "...";

        log.chat(`[ ${sender} ] in ${location} : ${body}`);
    }
};

function getPluginName(cmd, plugins) {
    if (!cmd) return "-";
    if (!plugins) return "Unknown"; 

    for (const [path, plugin] of Object.entries(plugins)) {
        if (plugin.command === cmd || (plugin.alias && plugin.alias.includes(cmd))) {
            return path.split('/').pop();
        }
    }
    return "Unknown";
}





/*
const color = require("chalk");
const moment = require("moment-timezone");
const log = require("./logs.js");

module.exports = (m, pg) => {
  let isGroup = m.key.remoteJid?.endsWith("@g.us");
  let chatType = isGroup
    ? "Group Chat"
    : m.key.remoteJid?.endsWith("@s.whatsapp.net")
    ? "Private Chat"
    : "Other";

  let info = "";
  info += color.magenta.bold("\n- - - - - [ Chat Information ] - - - - -\n");
  info += color.white.bold(` - Tanggal : ${color.yellow(moment().tz("Asia/Jakarta").format("dddd, DD MMMM YYYY HH:mm:ss"))}\n`);
  info += color.white.bold(` - JID     : ${color.green(m.key.remoteJid)}\n`);
  info += color.white.bold(` - Sender  : ${color.cyan(m.sender)}\n`);
  info += color.white.bold(` - Msg ID  : ${color.gray(m.key.id)}\n`);
  info += color.white.bold(` - Tipe    : ${color.yellow(m.type)}\n`);
  info += color.white.bold(` - Dari    : ${color.green.bold(chatType)}\n`);

  if (isGroup && m.metadata?.subject) {
    info += color.white.bold(` - Subject : ${color.cyan.bold(m.metadata.subject)}\n`);
  }

  info += color.white.bold(` - Nama    : ${color.cyan.bold(m.pushName || "-")}\n`);

  if (m.prefix && m.command) {
    const name = getPluginName(m.command, pg.plugins);
    info += color.white.bold(` - Command : ${color.green.bold(m.prefix + m.command)}\n`);
    info += color.white.bold(` - Plugin  : ${color.yellow.bold(name)}\n`);
  }

  info += color.magenta.bold("- - - - - - - - - - - - - - -");
  // info += color.gray(m.body || "[No Message Body]");

  console.log(info);
  log.chat("\n" + m.body || "\n[No Message Body]");
};

function getPluginName(cmd, plugins) {
  if (!cmd) return "-";

  for (const [path, plugin] of Object.entries(plugins)) {
    if (
      plugin.command === cmd ||
      (plugin.alias && plugin.alias.includes(cmd))
    ) {
      return path.split('/').pop();
    }
  }

  return "Unknown";
}
*/