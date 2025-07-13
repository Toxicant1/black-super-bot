/* If it works, don't fix it */

const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const chalk = require("chalk");
const { default: ravenConnect, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 10000;
const logger = pino({ level: "silent" });

/* === SERVE UI === */
app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/pixel/index.html")));

/* === BELTAH WHATSAPP CONNECTION === */
async function startRaven() {
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/sessions/");
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const client = ravenConnect({
    logger,
    printQRInTerminal: false,
    browser: ["BLACK BELTAH - AI", "Chrome", "114.0.5735.198"],
    auth: state,
    syncFullHistory: true
  });

  client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk.red("⚠️ Reconnecting..."));
        startRaven();
      }
    } else if (connection === "open") {
      console.log(chalk.green("✅ BLACK BELTAH connected successfully!"));
    }
  });

  client.ev.on("creds.update", saveCreds);

  setInterval(() => {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "Africa/Nairobi" });
    client.updateProfileStatus(`🤖 ${time} | BLACK BELTAH active 💥`);
  }, 5 * 60 * 1000);

  return client;
}

/* === START SERVER + BOT === */
app.listen(PORT, () => {
  console.log(chalk.blue(`🌐 Beltah UI is live on http://localhost:${PORT}`));
  startRaven();
});

/* === HOT RELOAD (optional) === */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`🔁 File '${__filename}' updated. Reloading...`));
  delete require.cache[file];
  require(file);
});