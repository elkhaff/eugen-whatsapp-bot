module.exports = async (m, sock, db, up) => {
  let senderParticipant = up.key.participant;
  let messageStubParams = up.messageStubParameters;
  const id = m.cht;

  const getJid = (jidOrLid) => {
    let chat = sock.groupData[id];
    if (!chat || !jidOrLid) return jidOrLid;
    let found = chat.participants.find(p => p.id === jidOrLid || p.lid === jidOrLid);
    return found ? found.jid : jidOrLid;
  };

  const config = {
    groupSubject: "Nama grup telah diubah menjadi *@subject* oleh admin @admin.",
    groupPp: "Foto profil grup telah diperbarui oleh admin @admin.",
    groupRestrict: "Pengaturan grup telah diperbarui: *hanya admin* yang dapat mengirim pesan. (Diubah oleh @admin)",
    groupUnrestrict: "Pengaturan grup telah diperbarui: *semua anggota* kini dapat mengirim pesan. (Diubah oleh @admin)",
    groupOpen: "Grup telah *dibuka* oleh admin @admin. Sekarang semua anggota dapat mengirim pesan.",
    groupClose: "Grup telah *ditutup* oleh admin @admin. Hanya admin yang dapat mengirim pesan.",
    promote: "@user telah *diangkat menjadi admin* oleh @admin.",
    demote: "@user telah *diturunkan dari admin* oleh @admin."
  };

  if (up.key.remoteJid.includes("@g.us")) {
    let chat = sock.groupData[id];
    if (!chat) return;

    let adminJid = getJid(senderParticipant);

    switch (up.messageStubType) {
      case 21: {
        chat.subject = messageStubParams[1];
        chat.subjectOwner = senderParticipant;
        chat.subjectTime = Date.now();
        if (!db.list().group[id]?.detector) return;
        let text = config.groupSubject.replace("@subject", messageStubParams[1]).replace("@admin", "@" + adminJid.split("@")[0]);
        m.reply2({ text: text, mentions: [adminJid] });
        break;
      }

      case 22: {
        if (!db.list().group[id]?.detector) return;
        let text = config.groupPp.replace("@admin", "@" + adminJid.split("@")[0]);
        m.reply2({ text: text, mentions: [adminJid] });
        break;
      }

      case 25: {
        chat.restrict = messageStubParams.includes("on");
        if (!db.list().group[id]?.detector) return;
        let text = (chat.restrict ? config.groupRestrict : config.groupUnrestrict).replace("@admin", "@" + adminJid.split("@")[0]);
        m.reply2({ text: text, mentions: [adminJid] });
        break;
      }

      case 26: {
        chat.announce = messageStubParams.includes("on");
        if (!db.list().group[id]?.detector) return;
        let text = (chat.announce ? config.groupClose : config.groupOpen).replace("@admin", "@" + adminJid.split("@")[0]);
        m.reply2({ text: text, mentions: [adminJid] });
        break;
      }
      
      case 29: {
        let users = [];
        for (let i of messageStubParams) {
          let realJid = getJid(i);
          users.push(realJid);
          let b = chat.participants.findIndex((v) => v.id == i || v.lid == i);
          if (b !== -1) chat.participants[b].admin = "admin";
        }
        if (!db.list().group[id]?.detector) return;
        let text = config.promote
          .replace("@admin", "@" + adminJid.split("@")[0])
          .replace("@user", users.map((v) => `@${v.split("@")[0]}`).join(", "));
        m.reply2({ text: text, mentions: [adminJid, ...users] });
        break;
      }

      case 30: {
        let users = [];
        for (let i of messageStubParams) {
          let realJid = getJid(i);
          users.push(realJid);
          let b = chat.participants.findIndex((v) => v.id == i || v.lid == i);
          if (b !== -1) chat.participants[b].admin = null;
        }
        if (!db.list().group[id]?.detector) return;
        let text = config.demote
          .replace("@admin", "@" + adminJid.split("@")[0])
          .replace("@user", users.map((v) => `@${v.split("@")[0]}`).join(", "));
        m.reply2({ text: text, mentions: [adminJid, ...users] });
        break;
      }
    }
  }
};









/*
module.exports = async (m, sock, db, up) => {
  let senderParticipant = up.key.participant;
  let messageStubParams = up.messageStubParameters;
  const config = {
    groupSubject: "Nama grup telah diubah menjadi *@subject* oleh admin @admin.",
    groupPp: "Foto profil grup telah diperbarui oleh admin @admin.",
    groupRestrict: "Pengaturan grup telah diperbarui: *hanya admin* yang dapat mengirim pesan. (Diubah oleh @admin)",
    groupUnrestrict: "Pengaturan grup telah diperbarui: *semua anggota* kini dapat mengirim pesan. (Diubah oleh @admin)",
    groupOpen: "Grup telah *dibuka* oleh admin @admin. Sekarang semua anggota dapat mengirim pesan.",
    groupClose: "Grup telah *ditutup* oleh admin @admin. Hanya admin yang dapat mengirim pesan.",
    promote: "@user telah *diangkat menjadi admin* oleh @admin.",
    demote: "@user telah *diturunkan dari admin* oleh @admin."
  };
  if (up.key.remoteJid.includes("@g.us")) {
    switch (up.messageStubType) {
      // DETEK SUBJECT
      case 21: {
        let chat = sock.groupData[m.cht];
        console.log(messageStubParams);
        chat.subject = messageStubParams[1];
        chat.subjectOwner = senderParticipant;
        chat.subjectTime = Date.now();
        console.log(`Menyingkronkan Ulang Metadata Pada Chat: ${m.metadata.subject}`);
        if (!db.list().group[m.cht].detector) return;
        let text = config.groupSubject.replace("@subject", messageStubParams[1]).replace("@admin", "@" + senderParticipant.split("@")[0]);
        m.reply2({ text: text, mentions: await sock.parseMention(text) });
        break;
      };

      // DETEK PP UPDATE GC
      case 22: {
        if (!db.list().group[m.cht].detector) return;
        let text = config.groupPp.replace("@admin", "@" + senderParticipant.split("@")[0]);
        m.reply2({ text: text, mentions: await sock.parseMention(text) });
        break;
      };

      // DETEK SETTING GC
      case 25: {
        if (messageStubParams.includes("off")) {
          let chat = sock.groupData[m.cht];
          chat.restrict = false;
          console.log(`Menyingkronkan ulang metadata pada chat: ${m.metadata.subject}`);
          if (!db.list().group[m.cht].detector) return;
          let text = config.groupRestrict.replace("@admin", "@" + senderParticipant.split("@")[0]);
          return m.reply2({ text: text, mentions: await sock.parseMention(text) });
        } else if (messageStubParams.includes("on")) {
          let chat = sock.groupData[m.cht];
          chat.restrict = true;
          console.log(`Menyingkronkan ulang metadata pada chat: ${m.metadata.subject}`);
          if (!db.list().group[m.cht].detector) return;
          let text = config.groupUnrestrict.replace("@admin", "@" + senderParticipant.split("@")[0]);
          return m.reply2({ text: text, mentions: await sock.parseMention(text) });
        };
        break;
      };

      // DETEK TUTUP/BUKA GC
      case 26: {
        if (messageStubParams.includes("off")) {
          let chat = sock.groupData[m.cht];
          chat.announce = false;
          console.log(`Menyingkronkan ulang metadata pada chat: ${m.metadata.subject}`);
          if (!db.list().group[m.cht].detector) return;
          let text = config.groupOpen.replace("@admin", "@" + senderParticipant.split("@")[0]);
          return m.reply2({ text: text, mentions: await sock.parseMention(text) });
        };
        if (messageStubParams.includes("on")) {
          let chat = sock.groupData[m.cht];
          chat.announce = true;
          console.log(`Menyingkronkan ulang metadata pada chat: ${m.metadata.subject}`);
          if (!db.list().group[m.cht].detector) return;
          let text = config.groupClose.replace("@admin", "@" + senderParticipant.split("@")[0]);
          return m.reply2({ text: text, mentions: await sock.parseMention(text) });
        };
        console.log(`Menyingkronkan ulang metadata pada chat: ${m.metadata.subject}`);
        break;
      }
      
      // PROMOTE
      case 29: {
        let chat = sock.groupData[m.cht];
        console.log(messageStubParams)
        for (let i of messageStubParams) {
          let b = chat.participants.findIndex((v) => v.id == i);
          chat.participants.splice(b, 1);
          chat.participants.push({ id: i, admin: "admin" });
        }
        console.log(`Menyingkronkan ulang metadata pada chat: ${m.metadata.subject}`);
        if (!db.list().group[m.cht].detector) return;
        let text = config.promote.replace("@admin", "@" + senderParticipant.split("@")[0]).replace("@user", messageStubParams.map((v) => `@${v.split("@")[0]}`).join(", "));
        m.reply2({ text: text, mentions: await sock.parseMention(text) });
        break;
      };

      // DEMOTE
      case 30: {
        let chat = sock.groupData[m.cht];
        console.log(messageStubParams)
        for (let i of messageStubParams) {
          let b = chat.participants.findIndex((v) => v.id == i);
          chat.participants.splice(b, 1);
          chat.participants.push({ id: i, admin: null });
        }
        console.log(`Menyingkronkan ulang metadata pada chat: ${m.metadata.subject}`);
        if (!db.list().group[m.cht].detector) return;
        let text = config.demote.replace("@admin", "@" + senderParticipant.split("@")[0]).replace("@user", messageStubParams.map((v) => `@${v.split("@")[0]}`).join(", "));
        m.reply2({ text: text, mentions: await sock.parseMention(text) });
        break;
      };

    };
  } else {
    switch (up.messageStubType) {
    };
  };
};
*/