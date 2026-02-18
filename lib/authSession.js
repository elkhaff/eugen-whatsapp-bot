const initSqlJs = require('sql.js');
const fs = require('fs');
const { BufferJSON, initAuthCreds, proto } = require("baileys");

module.exports = async function useSqljsAuthState(dbPath) {
    const SQL = await initSqlJs();
    let db;

    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
        db.run("CREATE TABLE IF NOT EXISTS session (id TEXT PRIMARY KEY, data TEXT)");
    }

    const saveToDisk = () => {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    };

    const readData = (id) => {
        const res = db.exec("SELECT data FROM session WHERE id = ?", [id]);
        if (res.length > 0 && res[0].values.length > 0) {
            return JSON.parse(res[0].values[0][0], BufferJSON.reviver);
        }
        return null;
    };

    const writeData = (id, data) => {
        const value = JSON.stringify(data, BufferJSON.replacer);
        db.run("INSERT OR REPLACE INTO session (id, data) VALUES (?, ?)", [id, value]);
        saveToDisk();
    };

    const creds = readData("creds") || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = readData(`${type}-${id}`);
                            if (type === "app-state-sync-key" && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id];
                            const key = `${type}-${id}`;
                            if (value) writeData(key, value);
                            else {
                                db.run("DELETE FROM session WHERE id = ?", [key]);
                                saveToDisk();
                            }
                        }
                    }
                }
            }
        },
        saveCreds: () => writeData("creds", creds)
    };
}