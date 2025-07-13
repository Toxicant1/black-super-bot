/* If it works, don't fix it */

const express = require("express"); const fs = require("fs"); const path = require("path"); const pino = require("pino"); const chalk = require("chalk"); const { default: ravenConnect, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys"); const { Boom } = require("@hapi/boom"); const app = express(); const PORT = process.env.PORT || 10000;

// Logging setup const logger = pino({ level: "silent" });

// Serve the frontend from /pixel folder app.use(express.static("pixel")); app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/index.html")));

// Start Express server app.listen(PORT, () => console.log(\n⚡ Beltah-MD Web UI is live on http://localhost:${PORT}\n));

// Raven/Beltah WhatsApp Connection Logic async function startRaven() { const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/sessions/"); const { version, isLatest } = await fetchLatestBaileysVersion();

const client = ravenConnect({ logger: pino({ level: "silent" }), printQRInTerminal: false, browser: ["BLACK BELTAH - AI", "Chrome", "114.0.5735.198"], auth: state, syncFullHistory: true, });

client.ev.on("connection.update", ({ connection, lastDisconnect }) => { if (connection === "close") { if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startRaven(); } else if (connection === "open") { console.log(chalk.green("✅ BLACK BELTAH Connected successfully!")); } });

client.ev.on("creds.update", saveCreds);

// Optional: Auto-status update logic setInterval(() => { const time = new Date().toLocaleTimeString("en-US", { timeZone: "Africa/Nairobi" }); client.updateProfileStatus(🤖 ${time} | BLACK BELTAH active 💥); }, 5 * 60 * 1000);

return client; }

// Initialize bot startRaven();

// Hot Reload let file = require.resolve(__filename); fs.watchFile(file, () => { fs.unwatchFile(file); console.log(chalk.redBright(\n🔁 File '${__filename}' updated. Reloading...)); delete require.cache[file]; require(file); });

