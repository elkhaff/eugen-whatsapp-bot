module.exports = {
    events: async (m, {
        sock, db
    }) => {
        try {
            const sender = m.sender
            if (m.isBot) return;
            
            const count = Math.floor(Math.random() * 10) + 5;
            const dbSender = db.list().user[sender];
            
            if (m.command) {
                dbSender.xp += count;
            }
        } catch (error) {
            console.error("Error in events handler:", error);
        }
    },
};