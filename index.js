/* If it works, don't fix it */

const {
  default: ravenConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  jidDecode,
  proto
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const express = require("express");
const chalk = require("chalk");
const figlet = require("figlet");
const { File } = require("megajs");
const axios = require("axios");
const app = express();

const Events = require("./action/events");
const logger = pino({ level: "silent" });
const { smsg } = require("./lib/ravenfunc");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require("./lib/ravenexif");
const { session, port, autobio, autolike, autoviewstatus, mycode, anticall, antiforeign } = require("./set.js");
const makeInMemoryStore = require("./store/store.js");
const store = makeInMemoryStore({ logger });

async function authentication() {
  if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
    if (!session) return console.log('❌ SESSION not found. Please add session env.');
    const sessdata = session.replace("BELTAH;;;", '');
    const filer = await File.fromURL(`https://mega.nz/file/${sessdata}`);
    filer.download((err, data) => {
      if (err) throw err;
      fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
        console.log("✅ Session downloaded successfully");
        console.log("⏳ Connecting to WhatsApp. Hold on...");
      });
    });
  }
}

async function startBeltahBot() {
  await authentication();
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(chalk.green(figlet.textSync("BELTAH-BOT", { font: "Standard" })));
  console.log(chalk.blueBright(`💡 Using WA v${version.join(".")}, Latest: ${isLatest}`));

  const client = ravenConnect({
    logger,
    printQRInTerminal: false,
    browser: ["Beltah", "Chrome", "110.0.0.0"],
    auth: state,
    syncFullHistory: true
  });

  // Show pairing code when needed
  if (!state.creds.registered) {
    client.ev.once("connection.update", async (update) => {
      const { pairingCode } = update;
      if (pairingCode) {
        console.log(chalk.cyan(`🔗 Pair this device using code: ${pairingCode}`));
      }
    });
  }

  store.bind(client.ev);
  client.public = true;

  client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      startBeltahBot();
    } else if (connection === 'open') {
      console.log(chalk.green("✅ BeltahBot connected successfully"));
    }
  });

  client.ev.on("creds.update", saveCreds);

  // Auto bio
  if (autobio === 'TRUE') {
    setInterval(() => {
      const now = new Date();
      const bio = `${now.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}`;
      client.updateProfileStatus(bio);
    }, 10 * 1000);
  }

  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let mek = messages[0];
      if (!mek.message) return;
      mek.message = mek.message.ephemeralMessage?.message || mek.message;

      if (autoviewstatus === 'TRUE' && mek.key.remoteJid === "status@broadcast") {
        client.readMessages([mek.key]);
      }

      if (autolike === 'TRUE' && mek.key.remoteJid === "status@broadcast") {
        await client.sendMessage(mek.key.remoteJid, {
          react: { key: mek.key, text: "❤️" }
        });
      }

      let m = smsg(client, mek, store);
      const beltahCore = require("./blacks");
      beltahCore(client, m, null, store);

    } catch (e) {
      console.error("❌ Error on message upsert:", e);
    }
  });

  client.ev.on("group-participants.update", async (update) => {
    if (antiforeign === 'TRUE' && update.action === "add") {
      for (let participant of update.participants) {
        const jid = client.decodeJid(participant);
        const phone = jid.split("@")[0];
        if (!phone.startsWith(mycode)) {
          await client.sendMessage(update.id, { text: "⚠️ Foreign number not allowed." });
          await client.groupParticipantsUpdate(update.id, [jid], "remove");
        }
      }
    }
    Events(client, update);
  });

  client.ev.on("call", async ([call]) => {
    if (anticall === 'TRUE') {
      await client.rejectCall(call.id, call.from);
      await client.sendMessage(call.from, { text: "📵 Calls are not allowed. Text only." });
    }
  });
}

// Static HTML
app.use(express.static("pixel"));
app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));
app.listen(port, () => console.log(`🚀 BeltahBot running on http://localhost:${port}`));

// Start bot
startBeltahBot();

// Watch for file changes
fs.watchFile(require.resolve(__filename), () => {
  fs.unwatchFile(__filename);
  console.log(chalk.redBright(`📦 Reloading ${__filename}`));
  delete require.cache[require.resolve(__filename)];
  require(__filename);
});
