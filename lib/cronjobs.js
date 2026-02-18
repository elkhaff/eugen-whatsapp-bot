const moment = require("moment-timezone");
const cron = require("node-cron");
const useSqljsAuthState = require("./authSession.js");

module.exports = (db, sock, config) => {
  cron.schedule("* * * * *", () => {
    let user = Object.keys(db.list().user);
    let time = moment.tz(config.tz).format("HH:mm");
    if (db.list().settings.resetlimit == time) {
      for (let i of user) {
        db.list().user[i].limit = db.list().user[i].maxLimit;
      }
    }
  });

  cron.schedule('0 0 * * *', () => {
    db.list().settings.aiHistory = {};
    console.log('[ CRON ] Histori AI telah direset otomatis.');
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });
    
  cron.schedule('0 */6 * * *', () => {
    console.log('[ SYSTEM ] Membersihkan sampah session...');
    const success = clearSession();
    if (success) {
      console.log('[ OK ] Session berhasil dibersihkan!');
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });
    
  cron.schedule('* * * * *', async () => {
    const sewaList = db.list().settings.sewaList || [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const bufferTime = 10 * 60 * 1000;
    let isSewaChanged = false;

    for (let i = sewaList.length - 1; i >= 0; i--) {
      const sewa = sewaList[i];
      const sisa = sewa.expired - now;
      const groupData = sock.groupData[sewa.id]?.participants;
      const groupAdmins = groupData.filter(v => v.admin !== null).map(v => v.phoneNumber);

      if (sisa <= 0) {
        try {
          await sock.sendMessage(sewa.id, { 
            text: `Masa sewa bot telah berakhir.\nBot akan otomatis keluar dari grup ini.\n\nHubungi owner untuk perpanjang.`,
            mentions: groupAdmins,
          });
          await sock.groupLeave(sewa.id);
                    
          for (const owner of config.owner) {
            const ownerJid = owner.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
            await sock.sendMessage(ownerJid, { 
              text: `LOG AUTO-OUT\n\nGrup: ${sewa.nama}\nID: ${sewa.id}\nStatus: Expired & Berhasil Keluar` 
            }).catch(() => null);
          }
          sewaList.splice(i, 1);
          isSewaChanged = true;
        } catch (e) {
          sewaList.splice(i, 1);
          isSewaChanged = true;
        }
      } 
      else if (sisa <= oneDay && sisa > (oneDay - bufferTime) && !sewa.warned) {
        try {
          let jam = Math.floor((sisa % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          let menit = Math.floor((sisa % (1000 * 60 * 60)) / (1000 * 60));
                    
          await sock.sendMessage(sewa.id, { 
            text: `*PERINGATAN SEWA*\n\nMasa sewa bot di grup ini tersisa *${jam} jam ${menit} menit* lagi.\nSegera hubungi owner untuk perpanjang agar bot tidak keluar otomatis.` 
          });
                    
          sewaList[i].warned = true;
          isSewaChanged = true;
        } catch (e) {
          console.log("Error sewa warning: " + sewa.id);
        }
      }
    }
        
    if (isSewaChanged) {
      db.list().settings.sewaList = sewaList;
    }
  }, { 
  	scheduled: true,
    timezone: "Asia/Jakarta"
  });
};
