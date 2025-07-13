/* If it works, don’t fix it */

const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const chalk = require("chalk"); // ✅ chalk@4.1.2 compatible
const { default: ravenConnect, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");

const app = express();
const PORT = process.env.PORT || 10000;
const logger = pino({ level: "silent" });

/* === EXPRESS STATIC SERVING === */
app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/pixel/index.html")));

/* === Placeholder Pair Code Handler === */
app.get("/pair", (req, res) => {
  const number = req.query.number;
  if (!number || number.length < 8) {
    return res.send("⚠️ Invalid phone number");
  }
  // Replace this with actual session logic if needed
  const fakeCode = Math.random().toString().slice(2, 10);
  res.send(fakeCode);
});

/* === BELTAH WHATSAPP CONNECTION LOGIC === */
async function startRaven() {
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/sessions/");
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const client = ravenConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["BLACK BELTAH - AI", "Chrome", "114.0.5735.198"],
    auth: state,
    syncFullHistory: true,
  });

  client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk.red("Reconnecting to WhatsApp..."));
        startRaven();
      }
    } else if (connection === "open") {
      console.log(chalk.green("✅ BLACK BELTAH Connected successfully!"));
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

/* === INIT SERVER + BOT === */
app.listen(PORT, () => {
  console.log(chalk.blue(`🌐 Beltah UI is live on http://localhost:${PORT}`));
  startRaven();
});

/* === HOT RELOAD === */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`🔁 File '${__filename}' updated. Reloading...`));
  delete require.cache[file];
  require(file);
});