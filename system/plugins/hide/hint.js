const fs = require("node:fs");

module.exports = {
    command: "hint",
    alias: [],
    category: ["hide"],
    description: "Mendapatkan bantuan berupa huruf random!",
    settings: {
        group: true,
        limit: 2
    },
    async run(m, {
        sock,
        Func
    }) {
        const id = m.cht;
        if (!(id in sock.game)) {
            return m.reply('_Tidak ada sesi permainan berlangsung_');
        };
        await m.reply(await (await generateHint(sock.game[id].execute.json.jawaban)).trim());
    },
};

async function generateHint(word) {
    const wordArr = word.split('');
    const indicesToReplace = [];

    for (let i = 0; i < wordArr.length; i++) {
        if (wordArr[i] !== ' ') {
            indicesToReplace.push(i);
        }
    }

    const minUnderscores = Math.ceil(indicesToReplace.length * 0.4);
    const maxUnderscores = indicesToReplace.length;
    const numUnderscores = Math.max(
        1,
        Math.floor(Math.random() * (maxUnderscores - minUnderscores + 1)) + minUnderscores
    );

    const selectedIndices = new Set();

    while (selectedIndices.size < numUnderscores) {
        const randomIndex = indicesToReplace[Math.floor(Math.random() * indicesToReplace.length)];
        selectedIndices.add(randomIndex);
    }

    for (const index of selectedIndices) {
        wordArr[index] = '_ ';
    }

    return wordArr.join('');
}