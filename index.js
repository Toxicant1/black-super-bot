/* If it works, don't Fix it */
// ... [KEEP YOUR ORIGINAL IMPORTS HERE]
const express = require("express");
const path = require('path');
const pino = require("pino");
const { useMultiFileAuthState, fetchLatestBaileysVersion, default: ravenConnect } = require("@whiskeysockets/baileys");

// Keep all other requires...
const app = express();
const logger = pino({ level: 'silent' });

app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

/* 🔐 PAIR CODE GENERATION ENDPOINT */
app.get("/pair", async (req, res) => {
  const userNumber = req.query.number;

  if (!userNumber || !/^\d+$/.test(userNumber)) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }

  try {
    const sessionPath = path.join(__dirname, "sessions", userNumber);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const client = ravenConnect({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["BELTAH", "Chrome", "10.0"],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    const code = await client.requestPairingCode(`${userNumber}@s.whatsapp.net`);
    console.log(`✅ Pairing code for ${userNumber}: ${code}`);
    return res.status(200).json({ code });
  } catch (err) {
    console.error("❌ Pairing error:", err);
    return res.status(500).json({ error: "Failed to generate code" });
  }
});

/* ✅ START YOUR MAIN BOT HERE */
startRaven();

/* 🌐 WEB LISTENER */
app.listen(port, () => {
  console.log(`🟢 Server ready: http://localhost:${port}`);
});

/* 🔁 AUTORELOAD */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});