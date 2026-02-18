const {
  jidNormalizedUser,
  extractMessageContent,
  downloadMediaMessage,
  proto,
  areJidsSameUser,
  generateWAMessage,
} = require("baileys");
const config = require("../settings.js");
const axios = require("axios");

const getContentType = (content) => {
  if (content) {
    const keys = Object.keys(content);
    const key = keys.find(
      (k) =>
        (k === "conversation" ||
          k.endsWith("Message") ||
          k.includes("V2") ||
          k.includes("V3")) &&
        k !== "senderKeyDistributionMessage",
    );
    return key;
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
}

function normalizeWhatsAppID(jid, groupMetadata) {
  if (!jid) return jid;
  if (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@g.us")) return jid;

  if (jid.endsWith("@lid") && groupMetadata?.participants) {
    let found = groupMetadata.participants.find(p => p.id === jid);
    if (found?.phoneNumber) {
      return found.phoneNumber;
    }
  }

  return jid;
}

function normalizeWhatsAppList(jidList, groupMetadata) {
  return (jidList || []).map(jid => normalizeWhatsAppID(jid, groupMetadata));
}

module.exports = async (messages, sock, db) => {
  const m = {};
  if (!messages) return;
  m.message = parseMessage(messages.message);

  if (messages.key) {
    m.key = messages.key;
    
    // Perbaikan: Handling remoteJid LID di chat pribadi
    let rawCht = m.key.remoteJid;
    if (m.key.addressingMode === 'lid' && rawCht.endsWith('@lid') && m.key.remoteJidAlt) {
        rawCht = m.key.remoteJidAlt;
    }

    m.cht = rawCht.startsWith("status")
      ? jidNormalizedUser(m.key?.participant || messages.participant)
      : jidNormalizedUser(rawCht);
      
    m.fromMe = m.key.fromMe;
    m.id = m.key.id;
    m.device = /^3A/.test(m.id)
      ? "ios"
      : /^3E/.test(m.id)
        ? "web"
        : /^.{21}/.test(m.id)
          ? "android"
          : /^.{18}/.test(m.id)
            ? "desktop"
            : "unknown";
    m.isBot = (m?.id.indexOf("-") > 1) || m?.id.startsWith("SUKI") || m?.id.startsWith("BAE") || m?.id.startsWith("B1E") || m?.id.startsWith("3EB0") || m?.id.startsWith("ITSUKICHAN") || m?.id.startsWith("VRDN") || m?.id.startsWith("WA") || m?.id.startsWith("ELKF") || m?.id.startsWith("SSA") || m?.id.startsWith("FELZ") || (m?.id.indexOf("LTS-") > 1);
    m.isGroup = m.cht.endsWith("@g.us");
    
    // Participant handling untuk LID
    m.participant = jidNormalizedUser(
      (m.key.addressingMode === 'lid' ? m.key.participantAlt : (messages.participant || m.key.participant))
    ) || false;

    if (m.isGroup) {
      if (!(m.cht in sock.groupData)) sock.groupData[m.cht] = await sock.groupMetadata(m.cht);
      let groupMeta = sock.groupData[m.cht];
      // Gunakan normalizeWhatsAppID atau manual find
      let target = groupMeta?.participants.find(p => p.id === m.participant);
      m.sender = (target && target.phoneNumber) ? jidNormalizedUser(target.phoneNumber) : m.participant;
    } else {
      m.sender = jidNormalizedUser(m.fromMe ? sock.user.id : m.cht);
    }
  }

  if (m.isGroup) {
    if (!(m.cht in sock.groupData)) sock.groupData[m.cht] = await sock.groupMetadata(m.cht);
    m.metadata = sock.groupData[m.cht];
    m.groupAdmins = m.metadata.participants.reduce(
        (memberAdmin, memberNow) =>
          (memberNow.admin
            ? memberAdmin.push({
              id: memberNow.phoneNumber || memberNow.id, // Ambil phoneNumber jika ada
              admin: memberNow.admin,
            })
            : [...memberAdmin]) && memberAdmin,
        [],
      );
    m.isAdmin = !!m.groupAdmins.find((member) => member.id === m.sender);
    m.isBotAdmin = !!m.groupAdmins.find(
        (member) => member.id === jidNormalizedUser(sock.user.id),
      );
  }

  m.pushName = messages.pushName;
  m.isOwner = [
    sock.decodeJid(sock.user.id),
    ...config.owner.map((a) => a + "@s.whatsapp.net"),
  ].includes(m.sender);

  if (m.message) {
    m.type = getContentType(m.message) || Object.keys(m.message)[0];
    m.msg = parseMessage(m.message[m.type]) || m.message[m.type];
    
    m.mentions = [
      ...(m.msg?.contextInfo?.mentionedJid || []),
      ...(m.msg?.contextInfo?.groupMentions?.map((v) => v.groupJid) || []),
    ].map(jid => {
      if (jid.endsWith("@lid") && m.isGroup && sock.groupData[m.cht]?.participants) {
        let found = sock.groupData[m.cht].participants.find(p => p.id === jid);
        return found?.phoneNumber ? jidNormalizedUser(found.phoneNumber) : jid;
      }
      return jid;
    });

    m.body = 
      m.msg?.text || 
      m.msg?.conversation || 
      m.msg?.caption || 
      m.message?.conversation || 
      m.msg?.selectedButtonId || 
      m.msg?.singleSelectReply?.selectedRowId || 
      m.msg?.selectedId || 
      (m.msg?.nativeFlowResponseMessage?.paramsJson ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id : "") || 
      m.msg?.contentText || 
      m.msg?.selectedDisplayText || 
      m.msg?.title || 
      m.msg?.name || 
      "";
    m.prefix = new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi").test(m.body) ? m.body.match(new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi"))[0] : "";
    m.command = m.body && m.body.trim().replace(m.prefix, "").trim().split(/ +/).shift();
    m.args = m.body.trim().replace(new RegExp("^" + escapeRegExp(m.prefix), "i"), "").replace(m.command, "").split(/ +/).filter((a) => a) || [];
    m.text = m.args.join(" ").trim();
    m.expiration = m.msg?.contextInfo?.expiration || 0;
    m.timestamps = typeof messages.messageTimestamp === "number" ? messages.messageTimestamp * 1000 : m.msg.timestampMs * 1000;
    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;

    m.isQuoted = false;
    if (m.msg?.contextInfo?.quotedMessage) {
      m.isQuoted = true;
      m.quoted = {};
      m.quoted.message = parseMessage(m.msg?.contextInfo?.quotedMessage);

      if (m.quoted.message) {
        m.quoted.type = getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0];
        m.quoted.msg = parseMessage(m.quoted.message[m.quoted.type]) || m.quoted.message[m.quoted.type];
        m.quoted.isMedia = !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
        
        // Perbaikan: Handling LID di Quoted Participant
        const qKey = m.msg.contextInfo;
        const rawQuotedPart = qKey.addressingMode === 'lid' ? qKey.participantAlt : qKey.participant;

        m.quoted.key = {
          remoteJid: qKey.remoteJid || m.cht,
          participant: jidNormalizedUser(rawQuotedPart),
          fromMe: areJidsSameUser(jidNormalizedUser(rawQuotedPart), jidNormalizedUser(sock?.user?.id)),
          id: qKey.stanzaId,
        };

        m.quoted.cht = /g\.us|status/.test(qKey.remoteJid) ? m.quoted.key.participant : m.quoted.key.remoteJid;
        m.quoted.fromMe = m.quoted.key.fromMe;
        m.quoted.id = qKey.stanzaId;
        m.quoted.device = /^3A/.test(m.quoted.id) ? "ios" : /^3E/.test(m.quoted.id) ? "web" : /^.{21}/.test(m.quoted.id) ? "android" : /^.{18}/.test(m.quoted.id) ? "desktop" : "unknown";
        m.quoted.isBot = m.quoted.id.startsWith("-") || m.quoted.id.startsWith("SUKI") || m.quoted.id.startsWith("BAE") || m.quoted.id.startsWith("B1E") || m.quoted.id.startsWith("3EB0") || m.quoted.id.startsWith("ITSUKICHAN") || m.quoted.id.startsWith("VRDN") || m.quoted.id.startsWith("WA") || m.quoted.id.startsWith("ELKF") || m.quoted.id.startsWith("SSA") || m.quoted.id.startsWith("FELZ") || m.quoted.id.indexOf("LTS-") > 1;
        m.quoted.isGroup = m.quoted.cht.endsWith("@g.us");
        m.quoted.participant = jidNormalizedUser(rawQuotedPart) || false;
        
        // Quoted Sender normalization
        let qSender = rawQuotedPart || m.quoted.cht;
        if (qSender.endsWith("@lid") && m.isGroup && sock.groupData[m.cht]?.participants) {
          let found = sock.groupData[m.cht].participants.find(p => p.id === qSender);
          if (found?.phoneNumber) qSender = found.phoneNumber;
        }
        m.quoted.sender = jidNormalizedUser(qSender);
        
        m.quoted.pushName = (m.quoted.fromMe ? sock.user.name : (sock.contacts?.[m.quoted.sender]?.notify || db.list().user?.[m.quoted.sender]?.name || "Unknown") || "Unknown");
        m.quoted.mentions = [
          ...(m.quoted.msg?.contextInfo?.mentionedJid || []),
          ...(m.quoted.msg?.contextInfo?.groupMentions?.map((v) => v.groupJid) || []),
        ].map(jid => {
          if (jid.endsWith("@lid") && m.isGroup && sock.groupData[m.cht]?.participants) {
            let found = sock.groupData[m.cht].participants.find(p => p.id === jid);
            return found?.phoneNumber ? jidNormalizedUser(found.phoneNumber) : jid;
          }
          return jid;
        });

        m.quoted.body = 
    	  m.quoted.msg?.text || 
    	  m.quoted.msg?.caption || 
    	  m.quoted?.message?.conversation || 
    	  m.quoted.msg?.selectedButtonId || 
    	  m.quoted.msg?.singleSelectReply?.selectedRowId || 
    	  m.quoted.msg?.selectedId || 
    	  (m.quoted.msg?.nativeFlowResponseMessage?.paramsJson ? JSON.parse(m.quoted.msg.nativeFlowResponseMessage.paramsJson).id : "") || 
    	  m.quoted.msg?.contentText || 
    	  m.quoted.msg?.selectedDisplayText || 
    	  m.quoted.msg?.title || 
    	  m.quoted?.msg?.name || 
    	  "";
        m.quoted.emit = async (text) => {
          let messages = await generateWAMessage(m.key.remoteJid, { text: text, mentions: m.mentionedJid }, { quoted: m.quoted });
          messages.key.fromMe = areJidsSameUser(m.sender, sock.user.id);
          messages.key.id = m.key.id;
          messages.pushName = m.pushName;
          if (m.isGroup) messages.participant = m.sender;
          let msg = { ...m, messages: [proto.WebMessageInfo.fromObject(messages)], type: "append" };
          return sock.ev.emit("messages.upsert", msg);
        };
        m.quoted.prefix = new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi").test(m.quoted.body) ? m.quoted.body.match(new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi"))[0] : "";
        m.quoted.command = m.quoted.body && m.quoted.body.replace(m.quoted.prefix, "").trim().split(/ +/).shift();
        m.quoted.args = m.quoted.body.trim().replace(new RegExp("^" + escapeRegExp(m.quoted.prefix), "i"), "").replace(m.quoted.command, "").split(/ +/).filter((a) => a) || [];
        m.quoted.text = m.quoted.args.join(" ").trim() || m.quoted.body;
        m.quoted.isOwner = [sock.decodeJid(sock.user.id), ...config.owner.map((a) => a + "@s.whatsapp.net")].includes(m.quoted.sender);
        if (m.quoted.isMedia) m.quoted.download = async () => downloadMediaMessage(m.quoted, "buffer", {}, {});
        m.quoted.copy = (txt) => sock.cMod(m.cht, m.quoted, txt);
        m.quoted.forward = (jid, Boolean, quoted) => sock.copyNForward(jid, m.quoted, Boolean, quoted);
      }
    }
  }

  if (m.isMedia) m.download = async () => downloadMediaMessage(m, "buffer", {}, {});
  m.copy = (txt) => sock.cMod(m.cht, m, txt);
  m.forward = (jid, Boolean, quoted) => sock.copyNForward(jid, m, Boolean, quoted);
  m.reply = async (jid, text, options = {}) => {
    if (text === undefined) { text = jid; jid = m.cht; }
    return sock.sendMessage(jid, { ...(typeof text === 'object' ? text : { text }), ...options }, { quoted: m, ephemeralExpiration: m.expiration, ...options });
  };
  m.reply2 = async (jid, text, q, options = {}) => {
    if (text === undefined) { text = jid; jid = m.cht; }
    return sock.sendMessage(jid, { ...(typeof text === 'object' ? text : { text }), ...options }, { quoted: q, ephemeralExpiration: m.expiration, ...options });
  };
  m.react = async (emoji) => sock.sendMessage(m.cht, { react: { text: emoji, key: m.key } });
  m.emit = async (text) => {
    let messages = await generateWAMessage(m.key.remoteJid, { text: text, mentions: m.mentions }, { quoted: m.quoted });
    messages.key.fromMe = areJidsSameUser(m.sender, sock.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.pushName;
    if (m.isGroup) messages.participant = m.sender;
    let msg = { ...m, messages: [proto.WebMessageInfo.fromObject(messages)], type: "append" };
    return sock.ev.emit("messages.upsert", msg);
  };
  return m;
};

function parseMessage(content) {
  content = extractMessageContent(content);
  if (content && content.viewOnceMessageV2Extension) {
    content = content.viewOnceMessageV2Extension.message;
  }
  if (
    content &&
    content.protocolMessage &&
    content.protocolMessage.type == 14
  ) {
    let type = getContentType(content.protocolMessage);
    content = content.protocolMessage[type];
  }
  if (content && content.message) {
    let type = getContentType(content.message);
    content = content.message[type];
  }
  //- ProtoType - Function
  String.prototype.getSize = async function getSize() {
    let header = await (await axios.get(this)).headers;
    return this.formatSize(header["content-length"]);
  };

  Number.prototype.getRandom =
    String.prototype.getRandom =
    Array.prototype.getRandom =
    function getRandom() {
      if (Array.isArray(this) || this instanceof String)
        return this[Math.floor(Math.random() * this.length)];
      return Math.floor(Math.random() * this);
    };

  String.prototype.capitalize = function capitalize() {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length);
  };
  return content;
}







/*
const {
  jidNormalizedUser,
  extractMessageContent,
  downloadMediaMessage,
  proto,
  areJidsSameUser,
  generateWAMessage,
} = require("baileys");
const config = require("../settings.js");
const axios = require("axios");

const getContentType = (content) => {
  if (content) {
    const keys = Object.keys(content);
    const key = keys.find(
      (k) =>
        (k === "conversation" ||
          k.endsWith("Message") ||
          k.includes("V2") ||
          k.includes("V3")) &&
        k !== "senderKeyDistributionMessage",
    );
    return key;
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
}

function normalizeWhatsAppID(jid, groupMetadata) {
  if (!jid) return jid;
  if (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@g.us")) return jid;

  if (jid.endsWith("@lid") && groupMetadata?.participants) {
    let found = groupMetadata.participants.find(p => p.id === jid);
    if (found?.phoneNumber) {
      return found.phoneNumber;
    }
  }

  return jid;
}

function normalizeWhatsAppList(jidList, groupMetadata) {
  return (jidList || []).map(jid => normalizeWhatsAppID(jid, groupMetadata));
}

module.exports = async (messages, sock, db) => {
  const m = {};
  if (!messages) return;
  m.message = parseMessage(messages.message);
  const cht = m.cht = m.key?.remoteJid.startsWith("status")
    ? jidNormalizedUser(m.key?.participant || messages.participant)
    : jidNormalizedUser(m.key?.remoteJid);
  const isGroup =  m.cht.endsWith("@g.us");
  let groupMetadata = isGroup ? sock.groupData[cht] : null;
  if (messages.key) {
    m.key = messages.key;
    m.cht = m.key.remoteJid.startsWith("status")
      ? jidNormalizedUser(m.key?.participant || messages.participant)
      : jidNormalizedUser(m.key.remoteJid);
    m.fromMe = m.key.fromMe;
    m.id = m.key.id;
    m.device = /^3A/.test(m.id)
      ? "ios"
      : /^3E/.test(m.id)
        ? "web"
        : /^.{21}/.test(m.id)
          ? "android"
          : /^.{18}/.test(m.id)
            ? "desktop"
            : "unknown";
    m.isBot = (m?.id.indexOf("-") > 1) || m?.id.startsWith("SUKI") || m?.id.startsWith("BAE") || m?.id.startsWith("B1E") || m?.id.startsWith("3EB0") || m?.id.startsWith("ITSUKICHAN") || m?.id.startsWith("VRDN") || m?.id.startsWith("WA") || m?.id.startsWith("ELKF") || m?.id.startsWith("SSA") || m?.id.startsWith("FELZ") || (m?.id.indexOf("LTS-") > 1);
    m.isGroup = m.cht.endsWith("@g.us");
    m.participant =
      jidNormalizedUser(messages?.participant || m.key.participant) || false;
    if (m.isGroup) {
      let participantId = m.participant;

      if (!(m.cht in sock.groupData)) {
        const metadata = await sock.groupMetadata(m.cht);
        sock.groupData[m.cht] = metadata;
        if (metadata) sock.groupCache.set(m.cht, metadata);
      }
      let groupMeta = sock.groupData[m.cht];
      let target = groupMeta?.participants.find(p => p.id === participantId);

      if (target && target.phoneNumber) {
        m.sender = target.phoneNumber;
      } else {
        m.sender = participantId;
      }
    } else {
      m.sender = jidNormalizedUser(m.fromMe ? sock.user.id : m.cht);
    }
  }
  if (m.isGroup) {
    if (!(m.cht in sock.groupData)) {
      const metadata = await sock.groupMetadata(m.cht);
      sock.groupData[m.cht] = metadata;
      if (metadata) sock.groupCache.set(m.cht, metadata);
    }
    m.metadata = sock.groupData[m.cht];
    m.groupAdmins =
      m.isGroup &&
      m.metadata.participants.reduce(
        (memberAdmin, memberNow) =>
          (memberNow.admin
            ? memberAdmin.push({
              id: memberNow.jid,
              admin: memberNow.admin,
            })
            : [...memberAdmin]) && memberAdmin,
        [],
      );
    m.isAdmin =
      m.isGroup && !!m.groupAdmins.find((member) => member.id === m.sender);
    m.isBotAdmin =
      m.isGroup &&
      !!m.groupAdmins.find(
        (member) => member.id === jidNormalizedUser(sock.user.id),
      );
  }
  m.pushName = messages.pushName;
  m.isOwner = [
    sock.decodeJid(sock.user.id),
    ...config.owner.map((a) => a + "@s.whatsapp.net"),
  ].includes(m.sender);
  if (m.message) {
    m.type = getContentType(m.message) || Object.keys(m.message)[0];
    m.msg = parseMessage(m.message[m.type]) || m.message[m.type];
    // m.mentions = [
    //   ...(m.msg?.contextInfo?.mentionedJid || []),
    //   ...(m.msg?.contextInfo?.groupMentions?.map((v) => v.groupJid) || []),
    // ];
    m.mentions = [
      ...(m.msg?.contextInfo?.mentionedJid || []),
      ...(m.msg?.contextInfo?.groupMentions?.map((v) => v.groupJid) || []),
    ].map(jid => {
      if (jid.endsWith("@lid") && m.isGroup && sock.groupData[m.cht]?.participants) {
        let found = sock.groupData[m.cht].participants.find(p => p.id === jid);
        if (found?.phoneNumber) {
          return found.phoneNumber;
        }
      }
      return jid;
    });
    m.body =
      m.msg?.text ||
      m.msg?.conversation ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedId ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      m.msg?.name ||
      "";
      if (m.type === 'interactiveResponseMessage') {
        let prop = m.msg.nativeFlowResponseMessage?.paramsJson;
        if (prop) {
            try {
                let json = JSON.parse(prop);
                if (json.id) m.body = json.id;
            } catch (e) {
                m.body = prop; 
            }
        }
    }
    m.prefix = new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi").test(
      m.body,
    )
      ? m.body.match(new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi"))[0]
      : "";
    m.command =
      m.body && m.body.trim().replace(m.prefix, "").trim().split(/ +/).shift();
    m.args =
      m.body
        .trim()
        .replace(new RegExp("^" + escapeRegExp(m.prefix), "i"), "")
        .replace(m.command, "")
        .split(/ +/)
        .filter((a) => a) || [];
    m.text = m.args.join(" ").trim();
    m.expiration = m.msg?.contextInfo?.expiration || 0;
    m.timestamps =
      typeof messages.messageTimestamp === "number"
        ? messages.messageTimestamp * 1000
        : m.msg.timestampMs * 1000;
    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;

    m.isQuoted = false;
    if (m.msg?.contextInfo?.quotedMessage) {
      m.isQuoted = true;
      m.quoted = {};
      m.quoted.message = parseMessage(m.msg?.contextInfo?.quotedMessage);

      if (m.quoted.message) {
        m.quoted.type =
          getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0];
        m.quoted.msg =
          parseMessage(m.quoted.message[m.quoted.type]) ||
          m.quoted.message[m.quoted.type];
        m.quoted.isMedia =
          !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
        m.quoted.key = {
          remoteJid: m.msg?.contextInfo?.remoteJid || m.cht,
          participant: jidNormalizedUser(m.msg?.contextInfo?.participant),
          fromMe: areJidsSameUser(
            jidNormalizedUser(m.msg?.contextInfo?.participant),
            jidNormalizedUser(sock?.user?.id),
          ),
          id: m.msg?.contextInfo?.stanzaId,
        };
        m.quoted.cht = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid)
          ? m.quoted.key.participant
          : m.quoted.key.remoteJid;
        m.quoted.fromMe = m.quoted.key.fromMe;
        m.quoted.id = m.msg?.contextInfo?.stanzaId;
        m.quoted.device = /^3A/.test(m.quoted.id)
          ? "ios"
          : /^3E/.test(m.quoted.id)
            ? "web"
            : /^.{21}/.test(m.quoted.id)
              ? "android"
              : /^.{18}/.test(m.quoted.id)
                ? "desktop"
                : "unknown";
        m.quoted.isBot = m?.id.startsWith("-") || m?.quoted?.id.startsWith("SUKI") || m?.quoted?.id.startsWith("BAE") || m?.quoted?.id.startsWith("B1E") || m?.quoted?.id.startsWith("3EB0") || m?.quoted?.id.startsWith("ITSUKICHAN") || m?.quoted?.id.startsWith("VRDN") || m?.quoted?.id.startsWith("WA") || m?.quoted?.id.startsWith("ELKF") || m?.quoted?.id.startsWith("SSA") || m?.id.startsWith("FELZ") ||
          m.id.indexOf("LTS-") > 1;
        m.quoted.isGroup = m.quoted.cht.endsWith("@g.us");
        m.quoted.participant =
          jidNormalizedUser(m.msg?.contextInfo?.participant) || false;
        // m.quoted.sender = jidNormalizedUser(
        //   m.msg?.contextInfo?.participant || m.quoted.cht,
        // );
        let qSender = m.msg?.contextInfo?.participant || m.quoted.cht;
        if (qSender && qSender.endsWith("@lid") && m.isGroup && sock.groupData[m.cht]?.participants) {
          let found = sock.groupData[m.cht].participants.find(p => p.id === qSender);
          if (found?.phoneNumber) {
            qSender = found.phoneNumber;
          }
        }
        m.quoted.sender = jidNormalizedUser(qSender);
        m.quoted.pushName = (m.quoted.fromMe ? sock.user.name : (sock.contacts?.[m.quoted.sender]?.notify || db.list().user?.[m.quoted.sender]?.name || "Unknown") || "Unknown");
        m.quoted.mentions = [
          ...(m.quoted.msg?.contextInfo?.mentionedJid || []),
          ...(m.quoted.msg?.contextInfo?.groupMentions?.map(
            (v) => v.groupJid,
          ) || []),
        ].map(jid => {
          if (jid.endsWith("@lid") && m.isGroup && sock.groupData[m.cht]?.participants) {
            let found = sock.groupData[m.cht].participants.find(p => p.id === jid);
            if (found?.phoneNumber) {
              return found.phoneNumber;
            }
          }
          return jid;
        });
        m.quoted.body =
          m.quoted.msg?.text ||
          m.quoted.msg?.caption ||
          m.quoted?.message?.conversation ||
          m.quoted.msg?.selectedButtonId ||
          m.quoted.msg?.singleSelectReply?.selectedRowId ||
          m.quoted.msg?.selectedId ||
          m.quoted.msg?.contentText ||
          m.quoted.msg?.selectedDisplayText ||
          m.quoted.msg?.title ||
          m.quoted?.msg?.name ||
          (m.type === 'interactiveResponseMessage' ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id : "") ||
          "";
        m.quoted.emit = async (text) => {
          let messages = await generateWAMessage(
            m.key.remoteJid,
            {
              text: text,
              mentions: m.mentionedJid,
            },
            {
              quoted: m.quoted,
            },
          );
          messages.key.fromMe = areJidsSameUser(m.sender, sock.user.id);
          messages.key.id = m.key.id;
          messages.pushName = m.pushName;
          if (m.isGroup) messages.participant = m.sender;
          let msg = {
            ...m,
            messages: [proto.WebMessageInfo.fromObject(messages)],
            type: "append",
          };
          return sock.ev.emit("messages.upsert", msg);
        };
        m.quoted.prefix = new RegExp(
          "^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]",
          "gi",
        ).test(m.quoted.body)
          ? m.quoted.body.match(
            new RegExp("^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]", "gi"),
          )[0]
          : "";
        m.quoted.command =
          m.quoted.body &&
          m.quoted.body.replace(m.quoted.prefix, "").trim().split(/ +/).shift();
        m.quoted.args =
          m.quoted.body
            .trim()
            .replace(new RegExp("^" + escapeRegExp(m.quoted.prefix), "i"), "")
            .replace(m.quoted.command, "")
            .split(/ +/)
            .filter((a) => a) || [];
        m.quoted.text = m.quoted.args.join(" ").trim() || m.quoted.body;
        m.quoted.isOwner = [
          sock.decodeJid(sock.user.id),
          ...config.owner.map((a) => a + "@s.whatsapp.net"),
        ].includes(m.quoted.sender);
        //==========[ Function bot ]=============//
        if (m.quoted.isMedia) {
          m.quoted.download = async () => {
            return downloadMediaMessage(m.quoted, "buffer", {}, {});
          };
        }
        m.quoted.copy = (txt) => {
          return sock.cMod(m.cht, m.quoted, txt);
        };
        m.quoted.forward = (jid, Boolean, quoted) => {
          return sock.copyNForward(jid, m.quoted, Boolean, quoted);
        };
      }
    }
  }
  //======[ Function ] ========//
  if (m.isMedia) {
    m.download = async () => {
      return downloadMediaMessage(m, "buffer", {}, {});
    };
  }
  m.copy = (txt) => {
    return sock.cMod(m.cht, m, txt);
  };
  m.forward = (jid, Boolean, quoted) => {
    return sock.copyNForward(jid, m, Boolean, quoted);
  };
  m.reply = async (jid, text, options = {}) => {
    if (text === undefined) {
      text = jid;
      jid = m.cht;
    }
    let msg;
    if (typeof text === 'string') {
      msg = await sock.sendMessage(jid, {
        text,
        ...options
      }, {
        quoted: m,
        ephemeralExpiration: m.expiration,
        ...options
      });
    } else if (typeof text === 'object') {
      msg = await sock.sendMessage(jid, {
        ...text,
        ...options
      }, {
        quoted: m,
        ephemeralExpiration: m.expiration,
        ...options
      });
    }
    return msg;
  };
   m.reply2 = async (jid, text, q, options = {}) => {
    if (text === undefined) {
      text = jid;
      jid = m.cht;
    }
    let msg;
    if (typeof text === 'string') {
      msg = await sock.sendMessage(jid, {
        text,
        ...options
      }, {
        quoted: q,
        ephemeralExpiration: m.expiration,
        ...options
      });
    } else if (typeof text === 'object') {
      msg = await sock.sendMessage(jid, {
        ...text,
        ...options
      }, {
        quoted: q,
        ephemeralExpiration: m.expiration,
        ...options
      });
    }
    return msg;
  };
  m.react = async (emoji) => {
    await sock.sendMessage(m.cht, {
      react: {
        text: emoji,
        key: m.key,
      },
    });
  };
  m.emit = async (text) => {
    let messages = await generateWAMessage(
      m.key.remoteJid,
      {
        text: text,
        mentions: m.mentions,
      },
      {
        quoted: m.quoted,
      },
    );
    messages.key.fromMe = areJidsSameUser(m.sender, sock.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.pushName;
    if (m.isGroup) messages.participant = m.sender;
    let msg = {
      ...m,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: "append",
    };
    return sock.ev.emit("messages.upsert", msg);
  };
  return m;
};

function parseMessage(content) {
  content = extractMessageContent(content);
  if (content && content.viewOnceMessageV2Extension) {
    content = content.viewOnceMessageV2Extension.message;
  }
  if (
    content &&
    content.protocolMessage &&
    content.protocolMessage.type == 14
  ) {
    let type = getContentType(content.protocolMessage);
    content = content.protocolMessage[type];
  }
  if (content && content.message) {
    let type = getContentType(content.message);
    content = content.message[type];
  }
  //- ProtoType - Function
  String.prototype.getSize = async function getSize() {
    let header = await (await axios.get(this)).headers;
    return this.formatSize(header["content-length"]);
  };

  Number.prototype.getRandom =
    String.prototype.getRandom =
    Array.prototype.getRandom =
    function getRandom() {
      if (Array.isArray(this) || this instanceof String)
        return this[Math.floor(Math.random() * this.length)];
      return Math.floor(Math.random() * this);
    };

  String.prototype.capitalize = function capitalize() {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length);
  };
  return content;
}
*/