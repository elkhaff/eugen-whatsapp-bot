const TicTacToe = require("../../../lib/tictactoe.js");

module.exports = {
  command: "tictactoe",
  alias: ["ttt"],
  category: ["game"],
  description: "Bermain game TicTacToe!",
  settings: {
    group: true,
    limit: true
  },
  async run(m, { sock, db }) {
    const id = m.cht;
    sock.tictactoe = sock.tictactoe || {};

    if (Object.values(sock.tictactoe).find(room => [room.game.playerX, room.game.playerO].includes(m.sender))) {
      return m.reply("⚠️ Kamu masih berada dalam game TicTacToe.");
    }

    const mentioned = m.mentions?.[0];
    if (mentioned) {
      if (mentioned === m.sender) return m.reply("⚠️ Kamu tidak bisa menantang diri sendiri.");
      m.reply({
        text: `@${mentioned.split("@")[0]}, kamu ditantang bermain TicTacToe oleh @${m.sender.split("@")[0]}!\n\nBalas dengan *y* untuk menerima atau *t* untuk menolak.`,
        mentions: [mentioned, m.sender]
      });

      sock.tictactoe[id] = {
        id: generateRandomId(),
        x: id,
        o: "",
        state: "PENDING",
        initiator: m.sender,
        opponent: mentioned,
        game: new TicTacToe(m.sender, "o"),
      };

      setTimeout(() => {
        const room = sock.tictactoe[id];
        if (room?.state === "PENDING") delete sock.tictactoe[id];
      }, 60_000);

      return;
    }

    const room = Object.values(sock.tictactoe).find(r => r.state === "WAITING");
    if (room) {
      room.o = id;
      room.game.playerO = m.sender;
      room.state = "PLAYING";

      return startGame(m, sock, room);
    } else {
      const newRoom = {
        id: generateRandomId(),
        x: id,
        o: "",
        state: "WAITING",
        game: new TicTacToe(m.sender, "o")
      };
      sock.tictactoe[id] = newRoom;

      return m.reply("Menunggu pemain lain...\nKetik *.tictactoe* untuk bergabung.");
    }
  },
};

function generateRandomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function startGame(m, sock, room) {
  const renderBoard = () => {
    return room.game.render().map(v => ({
      X: "❌", O: "⭕",
      1: "1️⃣", 2: "2️⃣", 3: "3️⃣",
      4: "4️⃣", 5: "5️⃣", 6: "6️⃣",
      7: "7️⃣", 8: "8️⃣", 9: "9️⃣"
    }[v])).reduce((acc, cur, i) => {
      if (i % 3 === 0) acc.push([]);
      acc[acc.length - 1].push(cur);
      return acc;
    }, []).map(row => row.join("")).join("\n");
  };

  const str = `*TicTacToe Dimulai!*\n\n*Room ID:* ${room.id}

${renderBoard()}

Giliran @${room.game.currentTurn.split("@")[0]}`;
  
  await m.reply({
    text: str,
    mentions: [room.game.playerX, room.game.playerO],
  });
}






/*
let TicTacToe = require("../../../lib/tictactoe.js");

module.exports = {
    command: "tictactoe",
    alias: ["ttt"],
    category: ["game"],
    description: "Bermain game TicTacToe!",
    settings: {
        group: true,
        limit: true
    },
    async run(m, {
        sock,
        Func
    }) {
        try {
            const id = m.cht;
            if (!sock.tictactoe) {
                sock.tictactoe = {};
            }
            
            if (Object.values(sock.tictactoe).find((room) => room.id.startsWith("tictactoe") && [room.game.playerX, room.game.playerO].includes(m.sender))) {
                return m.reply(`Kamu masih berada dalam game!`);
            }
            
            let room = Object.values(sock.tictactoe).find((room) => room.state === "WAITING");
            
            if (room) {
                room.o = id;
                room.game.playerO = m.sender;
                room.state = "PLAYING";

                let gameBoard = room.game.render().map((v) => {
                    return {
                        X: "❌",
                        O: "⭕",
                        1: "1️⃣",
                        2: "2️⃣",
                        3: "3️⃣",
                        4: "4️⃣",
                        5: "5️⃣",
                        6: "6️⃣",
                        7: "7️⃣",
                        8: "8️⃣",
                        9: "9️⃣",
                    }[v];
                });
                let boardText = `*Room ID:* ${room.id}

${gameBoard.slice(0, 3).join("")}
${gameBoard.slice(3, 6).join("")}
${gameBoard.slice(6).join("")}

Giliran @${room.game.currentTurn.split("@")[0]}`;

                await m.reply({
                    text: `Lawan ditemukan! Permainan dimulai.`,
                    mentions: [room.game.playerX, room.game.playerO],
                });
                await m.reply({
                    text: `*[ Tic Tac Toe ]*\n\n${boardText}`,
                    mentions: [room.game.playerX, room.game.playerO],
                });
            } else {
                room = {
                    id: generateRandomId(),
                    x: id,
                    o: "",
                    game: new TicTacToe(m.sender, "o"),
                    state: "WAITING",
                };
                sock.tictactoe[id] = room;

                m.reply({ text: `Menunggu lawan bergabung...\nKetik \`${m.prefix}tictactoe\` untuk bergabung.` });
            }
        } catch (error) {
            console.error("Error in tebakkata command:", error);
        }
    },
};

function generateRandomId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let randomId = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomId += characters[randomIndex];
  }
  return randomId;
}
*/