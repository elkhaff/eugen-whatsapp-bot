const { spawn, exec } = require("node:child_process");
const path = require("node:path");
const chokidar = require("chokidar");
const { promisify } = require("node:util");
const log = require("./lib/logs.js");

const execPromise = promisify(exec);

class BotManager {
  constructor(entryPoint) {
    this.entryPoint = path.resolve(entryPoint);
    this.child = null;
    this.isRestarting = false;
  }

  start() {
    this.isRestarting = false;

    this.child = spawn("node", [this.entryPoint], {
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    });

    this.child.on("exit", (code) => {
      if (code !== 0 && code !== null && !this.isRestarting) {
        log.error(`Bot terhenti dengan kode: ${code}. Merestart...`);
        this.start();
      }
    });

    this.child.on("error", (err) => {
      log.error(`Gagal menjalankan subprocess: ${err.message}`);
    });
  }

  async restart() {
    if (this.isRestarting) return;
    this.isRestarting = true;

    if (this.child) {
      this.child.kill();
      await new Promise((resolve) => this.child.once("exit", resolve));
    }

    this.start();
  }

  async validateAndRestart(filename) {
    const relativePath = path.relative(process.cwd(), filename);

    if (this._reloadTimer) clearTimeout(this._reloadTimer);

    this._reloadTimer = setTimeout(async () => {
      try {
        await execPromise(`node --check "${filename}"`);
        log.success(`${relativePath} aman.`);

        if (this.child && this.child.connected) {
          this.child.send({ type: "reload", filename });
          log.info(`Hot reload dikirim → ${relativePath}`);
        } else {
          log.warn(`IPC tidak tersedia, merestart bot...`);
          await this.restart();
        }
      } catch (e) {
        log.error(`Syntax error di ${relativePath}`);
        log.error(e.stderr || e.message);
        log.warn(`Bot tetap berjalan dengan versi sebelumnya.`);
      }
    }, 500);
  }

  initWatcher() {
    const watchPaths = [
      path.resolve("lib"),
      path.resolve("system"),
      path.resolve("src"),
    ];

    const ignoredPaths = [
      path.resolve("system", "plugins"),
      path.resolve("scrapers"),
      path.resolve("node_modules"),
      path.resolve("sessions"),
      path.resolve(".git"),
    ];

    const watcher = chokidar.watch(watchPaths, {
      ignored: ignoredPaths,
      persistent: true,
      ignoreInitial: true,
    });

    watcher
      .on("add", (filename) => {
        const relativePath = path.relative(process.cwd(), filename);
        log.info(`File baru terdeteksi: ${relativePath}`);
      })
      .on("change", async (filename) => {
        if (!filename.endsWith(".js")) return;
        await this.validateAndRestart(filename);
      })
      .on("unlink", (filename) => {
        const relativePath = path.relative(process.cwd(), filename);
        log.warn(`File dihapus: ${relativePath}`);
      });

    log.info("WATCHER AKTIF: Memantau folder lib & system");
  }
}

const manager = new BotManager("./lib/client.js");
manager.initWatcher();
manager.start();
