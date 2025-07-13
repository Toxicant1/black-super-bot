/* If it works, don’t fix it */

const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const chalk = require("chalk"); // ✅ chalk@4.1.2
const { default: ravenConnect, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const { File } = require("megajs");

const app = express();
const PORT = process.env.PORT || 10000;
const logger = pino({ level: "silent" });

const SESSION_KEY = '4uk1gBKB#6pTKhfoBwi4uQCU3s7vw1Y7eK5oxFLbZ0uWh0ldcTcM';
/* === Serve UI from /pixel folder === */
app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/pixel/index.html")));

/* === Simulated Pair Code API === */
app.get("/pair", (req, res) => {
  const number = req.query.number;
  if (!number || number.length < 8) {
    return res.send("⚠️ Invalid phone number");
  }
  const fakeCode = Math.random().toString().slice(2, 10);
  res.send(fakeCode);
});

/* === Download MEGA session if missing === */
async function authentication() {
  const sessionPath = path.join(__dirname, "/sessions/creds.json");
  if (!fs.existsSync(sessionPath)) {
    console.log("📥 Downloading session...");
    const file = await File.fromURL(`https://mega.nz/file/${SESSION_KEY}`);
    file.download((err, data) => {
      if (err) throw err;
      fs.writeFileSync(sessionPath, data);
      console.log("✅ Session downloaded successfully.");
    });
  }
}

/* === WA Connection Boot === */
async function startRaven() {
  await authentication(); // make sure creds.json is there

  const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/sessions/");
  const { version } = await fetchLatestBaileysVersion();

  const client = ravenConnect({
    logger,
    printQRInTerminal: false,
    browser: ["BLACK BELTAH", "Chrome", "114.0.0.0"],
    auth: state,
    syncFullHistory: true,
  });

  client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk.red("🔁 Reconnecting to WhatsApp..."));
        startRaven();
      }
    } else if (connection === "open") {
      console.log(chalk.green("✅ BLACK BELTAH Connected successfully!"));
    }
  });

  client.ev.on("creds.update", saveCreds);

  setInterval(() => {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "Africa/Nairobi" });
    client.updateProfileStatus(`🤖 ${time} | BLACK BELTAH active 💥`);
  }, 5 * 60 * 1000);
}

/* === Start server + bot === */
app.listen(PORT, () => {
  console.log(chalk.blue(`🌐 Beltah UI is live on http://localhost:${PORT}`));
  startRaven();
});

/* === Hot reload watcher === */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`🔁 Reloading updated: ${__filename}`));
  delete require.cache[file];
  require(file);
});