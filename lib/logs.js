const util = require('util');

const color = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

const getTime = () => {
    return new Date().toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const formatLog = (type, msg, col) => {
    const time = getTime();
    const tag = `[ ${type} ]`;
    const coloredTag = `${col}${tag}${color.reset}`;
    // Menggunakan util.format agar bisa log object/array dengan rapi
    const text = util.format(...msg); 
    console.log(`${color.white}[ ${time} ]${color.reset} ${coloredTag} ${text}`);
};

module.exports = {
    info: (...msg) => formatLog('INFO', msg, color.cyan),
    success: (...msg) => formatLog('SUCCESS', msg, color.green),
    error: (...msg) => formatLog('ERROR', msg, color.red),
    warn: (...msg) => formatLog('WARNING', msg, color.yellow),
    cmd: (...msg) => formatLog('COMMAND', msg, color.magenta),
    db: (...msg) => formatLog('DATABASE', msg, color.blue),
    chat: (...msg) => formatLog('CHAT', msg, color.green),
    custom: (tag, colorName, ...msg) => formatLog(tag, msg, color[colorName] || color.white)
};