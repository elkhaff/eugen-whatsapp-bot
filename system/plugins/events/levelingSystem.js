const { canLevelUp, xpRange } = require("../../../lib/leveling.js");

const MAX_LEVEL = 100;
const roles = [
    { level: 1, tier: "Warrior III" },
    { level: 3, tier: "Warrior II" },
    { level: 5, tier: "Warrior I" },
    { level: 7, tier: "Elite III" },
    { level: 10, tier: "Elite II" },
    { level: 13, tier: "Elite I" },
    { level: 16, tier: "Master IV" },
    { level: 20, tier: "Master III" },
    { level: 25, tier: "Master II" },
    { level: 30, tier: "Master I" },
    { level: 35, tier: "Grandmaster V" },
    { level: 40, tier: "Grandmaster IV" },
    { level: 45, tier: "Grandmaster III" },
    { level: 50, tier: "Grandmaster II" },
    { level: 55, tier: "Grandmaster I" },
    { level: 60, tier: "Epic V" },
    { level: 65, tier: "Epic IV" },
    { level: 70, tier: "Epic III" },
    { level: 75, tier: "Epic II" },
    { level: 80, tier: "Epic I" },
    { level: 85, tier: "Legend V" },
    { level: 86, tier: "Legend IV" },
    { level: 87, tier: "Legend III" },
    { level: 88, tier: "Legend II" },
    { level: 89, tier: "Legend I" },
    { level: 90, tier: "Mythic V" },
    { level: 91, tier: "Mythic IV" },
    { level: 92, tier: "Mythic III" },
    { level: 93, tier: "Mythic II" },
    { level: 94, tier: "Mythic I" },
    { level: 95, tier: "Mythic Glory V" },
    { level: 96, tier: "Mythic Glory IV" },
    { level: 97, tier: "Mythic Glory III" },
    { level: 98, tier: "Mythic Glory II" },
    { level: 99, tier: "Mythic Glory I" },
    { level: 100, tier: "Mythic Immortal" }
];

module.exports = {
    events: async (m, {
        sock, db
    }) => {
        try {
            const senderId = m.sender;
            const senderName = m.pushName;
            if (m.isBot) return;
            
            let user = db.list().user[senderId];

            let beforeLevel = user.level;
            let beforeRole = user.tier;
            
            const getRoleByLevel = (level) => {
                let currentRole = roles[0].tier;
                for (const role of roles) {
                    if (level >= role.level) {
                        currentRole = role.tier;
                    } else {
                        break;
                    }
                }
                return currentRole;
            };
            
            while (canLevelUp(user.level, user.xp, 400)) {
                let { max } = xpRange(user.level, 400);
                user.xp = max;
                user.level++;
                user.tier = getRoleByLevel(user.level);
            }

            if (beforeLevel !== user.level) {
                let str = `*${senderName}* has leveled up!\n\nLevel: ${beforeLevel} --> ${user.level}\nXP: ${user.xp}`;
                if (beforeRole !== user.tier) {
                    str += `\nTier: ${beforeRole} --> ${user.tier}`;
                }
                m.reply(str);
            }
        } catch (error) {
            console.error("Error in events handler:", error);
        }
    },
};