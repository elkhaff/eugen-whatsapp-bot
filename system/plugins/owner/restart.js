module.exports = {
    command: ["restart"],
    alias: ["shutdown", "restart"],
    category: ["owner"],
    settings: {
        owner: true,
    },
    description: "Restart atau Shutdown Bot",
    async run(m, {
        Func
    }) {
        if (m.command === "shutdown") {
            await m.reply("> Shutting down the bot...");
            await Func.delay(3);
            process.exit(0);
        } else if (m.command === "restart") {
            await m.reply("> Restarting will be completed in 3 seconds...");
            await Func.delay(3);
            process.exit();
        }
    }
};