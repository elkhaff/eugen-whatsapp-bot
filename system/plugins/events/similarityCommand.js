module.exports = {
    events: async (m, { config, plugins }) => {
        const prefixes = config.prefix
        const input = m.body.toLowerCase().trim();

        const usedPrefix = prefixes.find(p => input.startsWith(p));
        if (!usedPrefix) return;

        const commandRaw = input.slice(usedPrefix.length).split(' ')[0];
        if (!commandRaw) return;

        const commands = plugins.flatMap(cmd => [cmd.command, ...cmd.alias]);

        if (commands.includes(commandRaw)) return;

        const suggestions = findSimilarCommands(commandRaw, commands);

        if (suggestions.length) {
            const suggestionText = suggestions.map(cmd => `- ${usedPrefix + cmd}`).join('\n');
            m.reply(`_Command *${commandRaw}* tidak ditemukan!_\n\nMungkin yang kamu maksud:\n${suggestionText}`);
        }
    },
};

function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, () => []);
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = b[i - 1] === a[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[b.length][a.length];
}

function findSimilarCommands(input, commandList = []) {
    const scores = [];

    for (let cmd of commandList) {
        const dist = levenshtein(input, cmd);
        const maxLen = Math.max(input.length, cmd.length);
        const similarity = (1 - dist / maxLen); // nilai 0.0 - 1.0

        if (similarity >= 0.6) {
            scores.push({ cmd, similarity });
        }
    }

    scores.sort((a, b) => b.similarity - a.similarity);
    return scores.map(x => x.cmd);
}
