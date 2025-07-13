/* If it works, don't fix it */

const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const chalk = require("chalk"); // ✅ CHALK v4
const {
  default: ravenConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 10000;
const logger = pino({ level: "silent" });

/* === Serve Frontend === */
app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/pixel/index.html")));

/* === BLACK BELTAH BOT START === */
async function startRaven() {
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/sessions/");
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const client = ravenConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["BLACK BELTAH", "Safari", "5.1.7"],
    auth: state,
    syncFullHistory: true,
  });

  client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log(chalk.red("❌ Connection lost. Reconnecting..."));
        startRaven();
      } else {
        console.log(chalk.red("❌ Logged out from WhatsApp."));
      }
    } else if (connection === "open") {
      console.log(chalk.green("✅ BLACK BELTAH connected to WhatsApp!"));
    }
  });

  client.ev.on("creds.update", saveCreds);

  // Auto Bio Update
  setInterval(() => {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "Africa/Nairobi" });
    client.updateProfileStatus(`🤖 ${time} | BLACK BELTAH ACTIVE`);
  }, 5 * 60 * 1000);
}

/* === Start Web + Bot === */
app.listen(PORT, () => {
  console.log(chalk.blue(`🌐 Beltah UI is live on http://localhost:${PORT}`));
  startRaven();
});

/* === Auto Reload on File Change === */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`🔁 '${__filename}' updated. Reloading...`));
  delete require.cache[file];
  require(file);
});