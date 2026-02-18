module.exports = {
    events: async (m, {
        sock, db
    }) => {
        try {
            const id = m.cht;
            const sender = m.sender
            if (m.isBot) return;

            if (m.isGroup) {
                if (db.list().group[id].calculateMessage) {
                    let messageCount = 1;
                    try {
                        const data = db.list().group[id].countMessage;
                        messageCount = (data[sender] || 0) + 1;
                    } catch (error) {
                        // Abaikan error dan gunakan nilai default
                    }

                    updateDb(db, id, sender, messageCount);
                }
            }
        } catch (error) {
            console.error("Error in events handler:", error);
        }
    },
};

const updateDb = (db, id, sender, newValue) => {
    let data = {};
    try {
        data = db.list().group[id].countMessage;
    } catch (error) {
        data = {};
    }

    data[sender] = newValue;
};