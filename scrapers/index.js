const chokidar = require("chokidar");
const path = require("node:path");
const fs = require("node:fs");
const { promisify } = require("node:util");
const chalk = require("chalk");

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const Scandir = async (dir) => {
  const subdirs = await readdir(path.resolve(dir));
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? Scandir(res) : res;
    }),
  );
  return files.flat();
};

class Scraper {
  #src;
  constructor(dir) {
    this.dir = dir;
    this.#src = {};
  }

  load = async () => {
    const files = await Scandir(this.dir);
    for (const file of files) {
      if (!file.endsWith(".js")) continue;
      await this._loadFile(file);
    }
    return this.#src;
  };

  _loadFile = async (filename) => {
    const name = path.basename(filename, path.extname(filename));
    try {
      if (require.cache[filename]) delete require.cache[filename];
      const mod = require(filename);
      this.#src[name] = mod;
      return true;
    } catch (e) {
      console.log(chalk.red(`❌ Gagal memuat scraper [${name}]: ${e.message}`));
      delete this.#src[name];
      return false;
    }
  };

  watch = async () => {
    const watcher = chokidar.watch(this.dir, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("add", async (filename) => {
      if (!filename.endsWith(".js")) return;
      const name = path.basename(filename, path.extname(filename));
      await this._loadFile(filename);
      console.log(chalk.greenBright(`📥 Scraper baru ditambahkan: ${name}`));
    });

    watcher.on("change", async (filename) => {
      if (!filename.endsWith(".js")) return;
      const name = path.basename(filename, path.extname(filename));
      await this._loadFile(filename);
      console.log(chalk.yellowBright(`✏️ Scraper diubah: ${name}`));
    });

    watcher.on("unlink", (filename) => {
      if (!filename.endsWith(".js")) return;
      const name = path.basename(filename, path.extname(filename));
      delete this.#src[name];
      delete require.cache[filename];
      console.log(chalk.redBright(`🗑️ Scraper dihapus: ${name}`));
    });
  };

  list = () => this.#src;
}

module.exports = Scraper;






/* 
const chokidar = require("chokidar");
const path = require("node:path");
const fs = require("node:fs");
const { promisify } = require("node:util");
const chalk = require("chalk");
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const Scandir = async (dir) => {
  let subdirs = await readdir(path.resolve(dir));
  let files = await Promise.all(
    subdirs.map(async (subdir) => {
      let res = path.resolve(path.resolve(dir), subdir);
      return (await stat(res)).isDirectory() ? Scandir(res) : res;
    }),
  );
  return files.reduce((a, f) => a.concat(f), []);
};
class Scraper {
  #src;
  constructor(dir) {
    this.dir = dir;
    this.#src = {};
  }
  load = async () => {
    let data = await Scandir("./scrapers/src");
    for (let i of data) {
      let name = i.split("/").pop().replace(".js", "");
      try {
        if (!i.endsWith(".js")) return;
        this.#src[name] = require(i);
      } catch (e) {
        console.log(chalk.red.bold("- Gagal memuat Scraper :" + e));
        delete this.#src[name];
      }
    }
    return this.#src;
  };
  watch = async () => {
    const watcher = chokidar.watch(path.resolve(this.dir), {
      persistent: true,
      ignoreInitial: true,
    });
    watcher.on("add", async (filename) => {
      if (!filename.endsWith(".js")) return;
      let name = filename.split("/").pop().replace(".js", "");
      if (require.cache[filename]) {
        delete require.cache[filename];
        this.#src[name] = require(filename);
        return this.load();
      }
      this.#src[name] = require(filename);
      console.log(
        chalk.cyan.bold("- Scraper Baru telah ditambahkan : " + name),
      );
      return this.load();
    });
    watcher.on("change", (filename) => {
      if (!filename.endsWith(".js")) return;
      let name = filename.split("/").pop().replace(".js", "");
      if (require.cache[filename]) {
        delete require.cache[filename];
        this.#src[name] = require(filename);
        return this.load();
      }
      console.log(chalk.cyan.bold("- Scraper telah diubah : " + name));
      return this.load();
    });
    watcher.on("unlink", (filename) => {
      if (!filename.endsWith(".js")) return;
      let name = filename.split("/").pop().replace(".js", "");
      delete this.#src[name];
      console.log(chalk.cyan.bold("- Scraper telah dihapus : " + name));
      return this.load();
    });
  };
  list = () => this.#src;
}

module.exports = Scraper;
*/