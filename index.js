/* If it works, don't fix it */

const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const chalk = require("chalk"); // Chalk v5 uses template literals!
const {
  default: ravenConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 10000;
const logger = pino({ level: "silent" });

/* === EXPRESS STATIC FILES === */
app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/pixel/index.html")));

/* === BELTAH WHATSAPP SESSION HANDLER === */
async function startRaven() {
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/sessions/");
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const client = ravenConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["BLACK BELTAH - AI", "Safari", "5.1.7"],
    auth: state,
    syncFullHistory: true,
  });

  client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk`{yellow ⚠️ Reconnecting to WhatsApp...}`);
        startRaven();
      }
    } else if (connection === "open") {
      console.log(chalk`{green ✅ BLACK BELTAH Connected successfully!}`);
    }
  });

  client.ev.on("creds.update", saveCreds);

  // Optional: Auto Status update every 5 minutes
  setInterval(() => {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "Africa/Nairobi" });
    client.updateProfileStatus(`🤖 ${time} | BLACK BELTAH active 💥`);
  }, 5 * 60 * 1000);

  return client;
}

/* === START EXPRESS SERVER & WHATSAPP === */
app.listen(PORT, () => {
  console.log(chalk`{blue 🌐 Beltah UI is live on http://localhost:${PORT}}`);
  startRaven();
});

/* === HOT RELOAD FILE LISTENER === */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk`{red 🔁 Reloading updated file: ${__filename}}`);
  delete require.cache[file];
  require(file);
});