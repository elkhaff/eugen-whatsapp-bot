const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const log = require('./logs.js');

class Database {
  #data = {
    user: {},
    group: {},
    stats: {},
    settings: {}
  };
  #dbs = {};
  #SQL;
  #dbDir;
  #dirty = new Set();
  _timer = null;

  constructor(dbDir, saveInterval = 1500) {
    this.#dbDir = dbDir;
    this.saveInterval = saveInterval;
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  default = () => ({
    user: {},
    group: {},
    stats: {},
    settings: {
      self: false,
      online: true,
      anticall: false,
      blockcmd: [],
      max_upload: "50MB",
      resetlimit: "04:00",
      responseList: {},
    },
  });

  mergeDeep(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.mergeDeep(target[key], source[key]);
      } else {
        if (!(key in target)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  init = async () => {
    log.db("✅ Memuat modul database SQL.js...");
    this.#SQL = await initSqlJs();
    const types = Object.keys(this.#data);
    const defaults = this.default();

    for (const type of types) {
      const dbPath = path.join(this.#dbDir, `${type}.sqlite`);
      
      try {
        if (fs.existsSync(dbPath)) {
          const fileBuffer = fs.readFileSync(dbPath);
          this.#dbs[type] = new this.#SQL.Database(fileBuffer);
        } else {
          this.#dbs[type] = new this.#SQL.Database();
        }
      } catch (e) {
        this.#dbs[type] = new this.#SQL.Database();
      }

      this.#dbs[type].exec(`
        CREATE TABLE IF NOT EXISTS data (
          id TEXT PRIMARY KEY,
          json TEXT
        )
      `);

      const stmt = this.#dbs[type].prepare('SELECT id, json FROM data');
      while (stmt.step()) {
        const row = stmt.getAsObject();
        try {
          const parsedData = JSON.parse(row.json);
          if (type === 'settings' && row.id === 'settings') {
            this.#data.settings = this.mergeDeep(parsedData, defaults.settings);
          } else {
            const id = row.id.includes(':') ? row.id.split(':')[1] : row.id;
            this.#data[type][id] = parsedData;
          }
        } catch (e) {
          log.error(`❌ Gagal memuat data korup di ${type}: ${row.id}`, e);
        }
      }
      stmt.free();
    }

    if (Object.keys(this.#data.settings).length === 0 || !this.#data.settings.max_upload) {
        this.#data.settings = defaults.settings;
        this._scheduleSave('settings', 'main');
    }

    log.success("Semua database (user, group, stats, settings) berhasil dimuat.");
    return this.#data;
  }

  read = () => {
    return this.#data;
  };

  _scheduleSave(type, id) {
    const key = type === 'settings' ? 'settings' : `${type}:${id}`;
    this.#dirty.add(key);

    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(this._saveNow, this.saveInterval);
  }

  _saveNow = () => {
    if (this.#dirty.size === 0) return;

    const dirtyItems = Array.from(this.#dirty);
    const affectedTypes = new Set();
    this.#dirty.clear();
    this._timer = null;

    for (const key of dirtyItems) {
      const [type, id] = key.includes(':') ? key.split(':') : [key, 'main'];
      affectedTypes.add(type);

      let dataToSave = (type === 'settings') ? this.#data.settings : this.#data[type]?.[id];
      let dbKey = key;

      if (dataToSave === undefined) {
        this.#dbs[type].run('DELETE FROM data WHERE id = ?', [dbKey]);
      } else {
        this.#dbs[type].run('INSERT OR REPLACE INTO data (id, json) VALUES (?, ?)', [dbKey, JSON.stringify(dataToSave)]);
      }
    }

    for (const type of affectedTypes) {
      try {
        const dbPath = path.join(this.#dbDir, `${type}.sqlite`);
        const data = this.#dbs[type].export();
        fs.writeFileSync(dbPath, Buffer.from(data));
      } catch (e) {
        log.error(`Gagal menyimpan database ${type}:`, e);
      }
    }
  }

  close = () => {
    log.db("Menyimpan sisa data ke SQLite...");
    if (this._timer) clearTimeout(this._timer);
    this._saveNow();
    for (const type in this.#dbs) {
      this.#dbs[type].close();
    }
    log.db("Semua koneksi SQLite ditutup.");
  };

  add = (type, id, newData) => {
    if (!this.#data[type]) return `- Tipe data ${type} tidak ditemukan!`;
    if (!this.#data[type][id]) {
      this.#data[type][id] = newData;
    } else {
      this.#data[type][id] = this.mergeDeep(this.#data[type][id], newData);
    }
    this._scheduleSave(type, id);
    return this.#data[type][id];
  };

  delete = (type, id) => {
    if (this.#data[type] && this.#data[type][id]) {
      delete this.#data[type][id];
      this._scheduleSave(type, id);
      return `- ${type} dengan ID ${id} telah dihapus.`;
    } else {
      return `- ${type} dengan ID ${id} tidak ditemukan!`;
    }
  };

  list = () => {
    const self = this;
    const handler = (path = []) => ({
      get(target, prop) {
        const val = target[prop];
        if (typeof val === 'object' && val !== null) {
          return new Proxy(val, handler([...path, prop]));
        }
        return val;
      },
      set(target, prop, value) {
        target[prop] = value;
        const fullPath = [...path, prop];
        const type = fullPath[0];
        if (type === 'settings') {
            self._scheduleSave('settings', 'main');
        } else if (fullPath.length >= 2) {
            const id = fullPath[1];
            self._scheduleSave(type, id);
        }
        return true;
      },
      deleteProperty(target, prop) {
        delete target[prop];
        const fullPath = [...path, prop];
        const type = fullPath[0];
        if (type === 'settings') {
            self._scheduleSave('settings', 'main');
        } else if (fullPath.length >= 2) {
            const id = fullPath[1];
            self._scheduleSave(type, id);
        }
        return true;
      }
    });
    return new Proxy(this.#data, handler());
  };

  main = async (m) => {
    if (m.isGroup) {
      await this.add("group", m.cht, {
        mute: false, calculateMessage: false, countMessage: {}, afk: {},
        listMsg: {}, listCmd: {}, welcome: false, goodbye: false, absen: [],
      });
    }
    await this.add("user", m.sender, {
      registeredAt: Date.now(), name: m.pushName || "Unknown", limit: 35,
      maxLimit: 35, balance: 0, xp: 0, level: 1, tier: "Warrior",
      register: false,
    });
    return this.list();
  };

  listData = () => {
    return this.#data;
  };
}

module.exports = Database;








/*
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

class Database {
  #data = {
    user: {},
    group: {},
    stats: {},
    settings: {}
  };
  #db;
  #SQL;
  #dbPath;
  #dirty = new Set();
  _timer = null;

  constructor(dbPath, saveInterval = 1500) {
    this.#dbPath = dbPath;
    this.saveInterval = saveInterval;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  default = () => ({
    user: {},
    group: {},
    stats: {},
    settings: {
      self: false,
      online: true,
      anticall: false,
      blockcmd: [],
      max_upload: "50MB",
      resetlimit: "04:00",
      responseList: {},
    },
  });

  mergeDeep(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.mergeDeep(target[key], source[key]);
      } else {
        if (!(key in target)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  init = async () => {
    console.log("✅ Memuat modul database SQL.js...");
    this.#SQL = await initSqlJs();
    const dir = path.dirname(this.#dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      const fileBuffer = fs.readFileSync(this.#dbPath);
      this.#db = new this.#SQL.Database(fileBuffer);
      console.log("✅ Database SQLite berhasil dimuat dari file.");
    } catch (e) {
      this.#db = new this.#SQL.Database();
      console.log("✅ File database tidak ditemukan, membuat database baru di memori.");
    }

    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS data (
        id TEXT PRIMARY KEY,
        json TEXT
      )
    `);

    const defaults = this.default();
    this.#data = {
        user: defaults.user,
        group: defaults.group,
        stats: defaults.stats,
        settings: defaults.settings
    };

    const stmt = this.#db.prepare('SELECT id, json FROM data');
    const allRows = [];
    while (stmt.step()) {
        allRows.push(stmt.getAsObject());
    }
    stmt.free();

    for (const row of allRows) {
        try {
            const data = JSON.parse(row.json);
            const [type, id] = row.id.split(':');

            if (row.id === 'settings') {
                this.#data.settings = this.mergeDeep(data, defaults.settings);
            } else if (this.#data[type]) {
                this.#data[type][id] = data;
            }
        } catch (e) {
            console.error(`❌ Gagal memuat data korup untuk ID: ${row.id}`, e);
        }
    }
    
    if (!allRows.some(r => r.id === 'settings')) {
        this._scheduleSave('settings', 'main');
    }
    
    console.log("✅ Database berhasil dimuat ke memori.");
    return this.#data;
  }

  read = () => {
    return this.#data;
  };

  _scheduleSave(type, id) {
    const key = type === 'settings' ? 'settings' : `${type}:${id}`;
    this.#dirty.add(key);

    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(this._saveNow, this.saveInterval);
  }

  _saveNow = () => {
    if (this.#dirty.size === 0) return;

    const dirtyItems = Array.from(this.#dirty);
    this.#dirty.clear();
    this._timer = null;

    for (const key of dirtyItems) {
        const [type, id] = key.split(':');
        let dataToSave;
        let dbKey;

        if (type === 'settings') {
          dataToSave = this.#data.settings;
          dbKey = 'settings';
        } else {
          dataToSave = this.#data[type]?.[id];
          dbKey = key;
        }

        if (dataToSave === undefined) {
          this.#db.run('DELETE FROM data WHERE id = ?', [dbKey]);
        } else {
          this.#db.run('INSERT OR REPLACE INTO data (id, json) VALUES (?, ?)', [dbKey, JSON.stringify(dataToSave)]);
        }
    }

    const data = this.#db.export();
    const buffer = Buffer.from(data);
    try {
        fs.writeFileSync(this.#dbPath, buffer);
    } catch (e) {
      console.error("❌ Gagal menyimpan ke SQLite:", e);
      dirtyItems.forEach(item => this.#dirty.add(item));
    }
  }

  close = () => {
    console.log("Menyimpan sisa data ke SQLite sebelum keluar...");
    if (this._timer) clearTimeout(this._timer);
    this._saveNow();
    this.#db.close();
    console.log("Koneksi SQLite ditutup dengan aman.");
  };

  add = (type, id, newData) => {
    if (!this.#data[type]) return `- Tipe data ${type} tidak ditemukan!`;
    
    if (!this.#data[type][id]) {
      this.#data[type][id] = newData;
    } else {
      this.#data[type][id] = this.mergeDeep(this.#data[type][id], newData);
    }
    
    this._scheduleSave(type, id);
    return this.#data[type][id];
  };

  delete = (type, id) => {
    if (this.#data[type] && this.#data[type][id]) {
      delete this.#data[type][id];
      this._scheduleSave(type, id);
      return `- ${type} dengan ID ${id} telah dihapus.`;
    } else {
      return `- ${type} dengan ID ${id} tidak ditemukan!`;
    }
  };

  list = () => {
    const self = this;
    
    const handler = (path = []) => ({
      get(target, prop) {
        const val = target[prop];
        if (typeof val === 'object' && val !== null) {
          return new Proxy(val, handler([...path, prop]));
        }
        return val;
      },
      set(target, prop, value) {
        target[prop] = value;
        const fullPath = [...path, prop];
        const type = fullPath[0];
        
        if (type === 'settings') {
            self._scheduleSave('settings', 'main');
        } else if (fullPath.length >= 2) {
            const id = fullPath[1];
            self._scheduleSave(type, id);
        }
        return true;
      },
      deleteProperty(target, prop) {
        delete target[prop];
        const fullPath = [...path, prop];
        const type = fullPath[0];
        
        if (type === 'settings') {
            self._scheduleSave('settings', 'main');
        } else if (fullPath.length >= 2) {
            const id = fullPath[1];
            self._scheduleSave(type, id);
        }
        return true;
      }
    });

    return new Proxy(this.#data, handler());
  };

  main = async (m) => {
    if (m.isGroup) {
      await this.add("group", m.cht, {
        mute: false, calculateMessage: false, countMessage: {}, afk: {},
        listMsg: {}, listCmd: {}, welcome: false, goodbye: false, absen: [],
      });
    }
    await this.add("user", m.sender, {
      registeredAt: Date.now(), name: m.pushName || "Unknown", limit: 35,
      maxLimit: 35, balance: 0, xp: 0, level: 1, tier: "Warrior",
      register: false,
    });
    return this.list();
  };

  listData = () => {
    return this.#data;
  };
}

module.exports = Database;
*/