const fs = require("fs");
const file = "node_modules/whatsapp-rust-bridge/dist/index.js";
let c = fs.readFileSync(file, "utf8");
if (c.includes('await "AGFzb')) {
  c = c.replace(/await\s+"AGFzb/g, '"AGFzb');
  fs.writeFileSync(file, c);
  console.log("Patched");
} else {
  console.log("Not found");
}