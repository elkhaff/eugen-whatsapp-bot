(async () => {
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    jidNormalizedUser,
    Browsers,
    proto,
    DisconnectReason,
    generateWAMessage,
    areJidsSameUser,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
  } = await import("baileys");
  const pino = require("pino");
  const { Boom } = require("@hapi/boom");
  const NodeCache = require("node-cache");
  const moment = require("moment-timezone");
  const chalk = require("chalk");
  const readline = require("node:readline");
  const simple = require("./lib/simple.js");
  const pkg = require("./package.json");
  const Database = require("./lib/database.js");
  const serialize = require("./lib/serialize.js");
  const config = require("./settings.js");
  const useSqljsAuthState = require("./lib/authSession.js");
  const log = require("./lib/logs.js");

  process.on('uncaughtException', console.error);

  const appenTextMessage = async (m, sock, text, chatUpdate) => {
    let messages = await generateWAMessage(
      m.key.remoteJid,
      {
        text: text,
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
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: "append",
    };
    return sock.ev.emit("messages.upsert", msg);
  };

  const groupCache = new NodeCache({stdTTL: 5 * 60, useClones: false});

  const question = (text) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((resolve) => {
      rl.question(text, resolve);
    });
  };
  const db = new Database(config.database);
  await db.init();

  const pg = new (await require(process.cwd() + "/lib/plugins"))(
    process.cwd() + "/system/plugins",
  );
  await pg.load();
  await pg.watch();

  const scraper = new (await require(process.cwd() + "/scrapers"))(
    process.cwd() + "/scrapers/src",
  );
  await scraper.load();
  await scraper.watch();

  /*
  setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    console.log(`🔍 RSS: ${used.toFixed(2)} MB`);
  }, 10000);
  */

  console.log(chalk.green.bold(`
    --------------------------------------
          Selamat datang di ${config.botName} 
    --------------------------------------
  `));

  console.log(chalk.yellow.bold("- Inisialisasi modul..."));
  console.log(chalk.cyan.bold("- API Baileys Telah Dimuat"));
  console.log(chalk.cyan.bold("- Sistem File Siap Digunakan"));
  console.log(chalk.cyan.bold("- Database Telah Diinisialisasi"));

  console.log(chalk.blue.bold("\nInfo Bot:"));
  console.log(chalk.white.bold("  | Status Server: ") + chalk.green.bold("Online"));
  console.log(chalk.white.bold("  | Versi: ") + chalk.magenta.bold(pkg.version));
  console.log(chalk.white.bold("  | Versi Node.js: ") + chalk.magenta.bold(process.version));

  console.log(chalk.blue.bold("\nMemuat plugin & scraper..."))

  async function system() {
    const { state, saveCreds } = await useSqljsAuthState(config.sessions); //useMultiFileAuthState(config.sessions);
    const { version } = await fetchLatestBaileysVersion();
    const sock = simple(
      {
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
                state.keys,
                pino().child({ level: "silent", stream: "store" })
            )
        },
        browser: Browsers.ubuntu("Chrome"),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
        //msgRetryCounterCache,
        cachedGroupMetadata: (jid) => groupCache.get(jid),
        msgRetryCounterMap: {},
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: message => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );

            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {}
                            },
                            ...message
                        }
                    }
                };
            }

            return message;
        },
        syncFullHistory: true
      },
    );

    sock.groupCache = groupCache;
    sock.groupData = sock.groupData || {};
    if (!sock.authState.creds.registered) {
      console.log(
        chalk.white.bold(
          "- Silakan masukkan nomor WhatsApp Anda, misalnya +628xxxx",
        ),
      );
      const phoneNumber = await question(chalk.green.bold(`– Nomor Anda: `));
      const code = await sock.requestPairingCode(phoneNumber, "3UG3NB0T");
      setTimeout(() => {
        console.log(chalk.white.bold("- Kode Pairing Anda: " + code));
      }, 3000);
    }

    //=====[ Pembaruan Koneksi ]======
    sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
        console.log(chalk.red.bold(`Koneksi ditutup karena (Code: ${lastDisconnect.error.output.statusCode}): `), lastDisconnect.error.output.payload.message);

        if (reason === DisconnectReason.badSession) {
            console.log(chalk.red.bold("File sesi buruk, Harap hapus sesi dan scan ulang"));
            process.exit(1);
        } 
        else if (reason === DisconnectReason.connectionClosed) {
            console.log(chalk.yellow.bold("Koneksi ditutup, mencoba menghubungkan kembali..."));
            system();
        } 
        else if (reason === DisconnectReason.connectionLost) {
            console.log(chalk.yellow.bold("Koneksi internet hilang, mencoba menghubungkan kembali..."));
            system();
        } 
        else if (reason === DisconnectReason.connectionReplaced) {
            console.log(chalk.green.bold("Koneksi diganti, sesi lain telah dibuka."));
            process.exit(0); 
        } 
        else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.red.bold("Perangkat logout, harap scan ulang."));
            process.exit(1);
        } 
        else if (reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
            console.log(chalk.cyan.bold("Memulai ulang koneksi..."));
            system();
        } 
        else if (reason === 428) {
            console.log(chalk.magenta.bold("Koneksi diputus paksa (428), mencoba masuk kembali..."));
            system();
        }
        else {
            console.log(chalk.white.bold(`Terputus dengan alasan tidak diketahui (${reason}), mencoba menyambung...`));
            system();
        }

    } else if (connection === "connecting") {
        log.info("Menghubungkan ke WhatsApp...");
    } else if (connection === "open") {
        log.success("Bot System Online!");
        try {
            const groups = await sock.groupFetchAllParticipating();
            for (const group of Object.values(groups)) {
                sock.groupData[group.id] = group;
                groupCache.set(group.id, group);
            }
            log.info(`📁 Group metadata loaded and cached: ${Object.keys(sock.groupData).length}`);
        } catch (e) {
            log.error("❌ Gagal ambil metadata grup:", e.message);
        }

        require("./lib/cronjobs.js")(db, sock, config);

      }
	});

    //=====[ Setelah Pembaruan Koneksi ]========//
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("groups.update", async (updates) => {
        for (const update of updates) {
            try {
                const metadata = await sock.groupMetadata(update.id);
                if (metadata) {
                    sock.groupData[update.id] = metadata;
                    groupCache.set(update.id, metadata);
                }
            } catch (e) {
                log.error(`Error updating group metadata cache for ${update.id}:`, e);
            }
        }
    });

    sock.ev.on("groups.upsert", async (update) => {
      if (!Array.isArray(update) || update.length === 0) return;
      for (const group of update) {
        try {
          log.info("Bot telah bergabung ke dalam grup:", group.subject);
          
          if (group.id && group.subject) {
            const metadata = await sock.groupMetadata(group.id);
            if (metadata) {
              sock.groupData[group.id] = metadata;
              groupCache.set(group.id, metadata);
            }
            let welcomeMessage = `Halo, saya adalah ${config.botName} yang dapat membantu dengan berbagai fitur.

Silakan ketik */menu* untuk melihat daftar perintah yang tersedia.

Informasi grup:
- Nama: ${metadata.subject}
- Jumlah anggota: ${metadata.size}

Terima kasih telah menambahkan Eugen ke dalam grup. Jika ada pertanyaan, silakan tanyakan kepada Owner.`;

            await sock.sendMessage(group.id, { text: welcomeMessage });
          }
        } catch (err) {
          log.error(`Terjadi kesalahan pada event groups.upsert untuk grup ${group.id}:`, err);
        }
      }
    });

    sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
      try {
        const metadata = await sock.groupMetadata(id);
        if (metadata) {
          sock.groupData[id] = metadata;
          groupCache.set(id, metadata);
        }
      } catch (e) {
        log.error(`Error updating group metadata cache for ${id}:`, e);
      }
    	const chat = sock.groupData[id];
    	if (!chat) return;
    	const group = db.list().group[id] || {};

    	const resolveJid = (input) => {
        	let found = chat.participants.find(p => p.id === input || p.lid === input);
        	return found ? found.id : input;
    	};
      //console.log(participants);

      let metadata;

      if (participants[0] !== sock.user.lid.split(":")[0] + "@lid") {
        metadata = await sock.groupMetadata(id);
        log.info(`Metadata fetched for group ${id} (${metadata.subject}) on participant update.`);
      }

    	switch (action) {
        	case "add":
            	if (group.welcome?.status) {
                	for (let user of participants) {
                    	let realJid = resolveJid(user);
                      console.log(realJid);
                    	let exists = chat.participants.findIndex(p => p.id === realJid);
                    	if (exists === -1) {
                    	    chat.participants.push({ id: realJid, admin: null });
                    	}

                    	let text = group.welcome.text || "Welcome @user to @group!";
                    	let message = text
                        	.replace(/@user/g, `@${realJid.split("@")[0]}`)
                        	.replace(/@name/g, await sock.getName(realJid))
                        	.replace(/@group|@subject/g, metadata.subject)
                        	.replace(/@desc/g, metadata.desc?.toString() || "-")
                        	.replace(/@member/g, metadata.participants.length)
                        	.replace(/@time/g, moment.tz("Asia/Jakarta").format("HH:mm"))
                        	.replace(/@date/g, moment.tz("Asia/Jakarta").format("DD/MM/YYYY"));

                    	let ppUrl;
                    	try {
                        	ppUrl = await sock.profilePictureUrl(realJid, "image");
                    	} catch {
                        	ppUrl = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                    	}

                    	await sock.sendMessage(id, {
                        	image: { url: ppUrl },
                        	caption: message,
                        	mentions: [realJid]
                    	});
                	}
            	}
            break;

        	case "remove":
            	if (group.goodbye?.status) {
                	for (let user of participants) {
                    	let realJid = resolveJid(user);
                        console.log(realJid);
                    	let text = group.goodbye.text || "Goodbye @user!";
                    	let message = text
                        	.replace(/@user/g, `@${realJid.split("@")[0]}`)
                        	.replace(/@name/g, await sock.getName(realJid))
                        	.replace(/@group|@subject/g, metadata.subject)
                        	.replace(/@member/g, metadata.participants.length)
                        	.replace(/@time/g, moment.tz("Asia/Jakarta").format("HH:mm"))
                        	.replace(/@date/g, moment.tz("Asia/Jakarta").format("DD/MM/YYYY"));

                    	let ppUrl;
                    	try {
                        	ppUrl = await sock.profilePictureUrl(realJid, "image");
                    	} catch {
                        	ppUrl = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                    	}

                    	await sock.sendMessage(id, {
                        	image: { url: ppUrl },
                        	caption: message,
                        	mentions: [realJid]
                    	});

                    	chat.participants = chat.participants.filter(p => p.id !== realJid);
                	}
            	}
            break;
    	}
	});

    sock.ev.on("call", async (callEvents) => {
      console.log(db.list().settings.anticall)
      if (db.list().settings.anticall) {
        callEvents.forEach((callEvent) => {
          sock.rejectCall(callEvent.id, callEvent.from)
        });
      }
    })

    sock.ev.on("messages.upsert", async (cht) => {
      // console.log(cht.messages);
      if (cht.messages.length === 0);
      const chatUpdate = cht.messages[0];
      // console.log(chatUpdate);
      const m = await serialize(chatUpdate, sock, db);
      await require("./system/group.js")(m, sock, db, chatUpdate);
      if (!chatUpdate.message) return;    
      if (m.isBot) return;
      if (!m.isOwner && db.list().settings.self) return;
      await require("./system/handler.js")(m, sock, db, pg, scraper);
    });

    // sock.ev.on("messages.update", async (chatUpdate) => {
    //   for (const { key, update } of chatUpdate) {
    //     if (update.pollUpdates && key.fromMe) {
    //       const pollCreation = await getMessage(key);
    //       if (pollCreation) {
    //         let pollUpdate = await getAggregateVotesInPollMessage({
    //           message: pollCreation?.message,
    //           pollUpdates: update.pollUpdates,
    //         });
    //         let string;
    //         const optionsWithOneVote = pollUpdate.filter(option => option.voters.length >= 1).map(option => option.name)[0];
    //         if (optionsWithOneVote?.includes("Ini Menu")) {
    //           string = "menu";
    //         }
    //         if (optionsWithOneVote?.includes("Kecepatan Bot")) {
    //           string = "ping";
    //         }
    //         if (optionsWithOneVote?.includes("mute")) {
    //           string = "mute " + optionsWithOneVote.split(" ")[1];
    //         }
    //         if (optionsWithOneVote?.includes("Voting player ke-") || optionsWithOneVote?.includes("Makan player ke-") || optionsWithOneVote?.includes("Lindungi player ke-") || optionsWithOneVote?.includes("Buka Identitas player ke-") || optionsWithOneVote?.includes("Lihat Peran player ke-") || optionsWithOneVote?.includes("Nomor Owner")) {
    //           // WEREWOLF
    //           if (optionsWithOneVote?.includes("Voting player ke-")) {
    //             string = "ww vote " + optionsWithOneVote?.replace(".", "")?.split("-")[1];
    //           }
    //           if (optionsWithOneVote?.includes("Makan player ke-")) {
    //             string = "wwpc kill " + optionsWithOneVote?.replace(".", "")?.split("-")[1];
    //           }
    //           if (optionsWithOneVote?.includes("Lindungi player ke-")) {
    //             string = "wwpc deff " + optionsWithOneVote?.replace(".", "")?.split("-")[1];
    //           }
    //           if (optionsWithOneVote?.includes("Buka Identitas player ke-")) {
    //             string = "wwpc sorcerer " + optionsWithOneVote?.replace(".", "")?.split("-")[1];
    //           }
    //           if (optionsWithOneVote?.includes("Lihat Peran player ke-")) {
    //             string = "wwpc dreamy " + optionsWithOneVote?.replace(".", "")?.split("-")[1];
    //           }
    //           if (optionsWithOneVote?.includes("Nomor Owner")) {
    //             string = "owner";
    //           }
    //         }
    //         // let toCmd = pollUpdate.filter((v) => v.voters.length !== 0)[0]?.name;
    //         console.log(m);
    //         await appenTextMessage(m, sock, "." + string, pollCreation);
    //         // await sock.sendMessage(m.cht, { delete: key });
    //       } else return false;
    //       return;
    //     }
    //   }
    // });

    return sock;
  }
  system();
})();