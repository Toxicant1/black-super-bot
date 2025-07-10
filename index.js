/* If it works, don't Fix it */
const {
  default: ravenConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require('path');
const axios = require("axios");
const express = require("express");
const chalk = require("chalk");
const FileType = require("file-type");
const figlet = require("figlet");
const { File } = require('megajs');
const app = express();
const _ = require("lodash");
let lastTextTime = 0;
const messageDelay = 5000;
const Events = require('./action/events');
const logger = pino({ level: 'silent' });
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/ravenexif');
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/ravenfunc');
const { sessionName, session, mode, prefix, autobio, autolike, port, mycode, anticall, antiforeign, packname, autoviewstatus } = require("./set.js");
const makeInMemoryStore = require('./store/store.js'); 
const store = makeInMemoryStore({ logger: logger.child({ stream: 'store' }) });
const color = (text, color) => (!color ? chalk.green(text) : chalk.keyword(color)(text));


// ✅ FIXED: AUTHENTICATION FUNCTION BLOCK (no duplication)
async function authentication() {
  if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
    if (!session) return console.log('Please add your session to SESSION env !!');

    const sessdata = session.replace("BLACK MD;;;", '');
    const filer = await File.fromURL(`https://mega.nz/file/${sessdata}`);

    filer.download((err, data) => {
      if (err) throw err;

      fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
        console.log("Session downloaded successfully✅️");
        console.log("Connecting to WhatsApp ⏳️, Hold on for 3 minutes⌚️");
      });
    });
  }
}


async function startRaven() {
  await authentication();
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA v${version.join(".")}, isLatest: ${isLatest}`);
  console.log(color(figlet.textSync("BELTAH BOT", { font: "Standard" }), "green"));

  const client = ravenConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["BELTAH AI", "Safari", "5.1.7"],
    auth: state,
    syncFullHistory: true,
  });

  store.bind(client.ev);

  client.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startRaven();
      }
    } else if (connection === 'open') {
      console.log(color("Congrats, BELTAH BOT is now connected to this server ✅", "green"));
      const Texxt = `✅ Connected to 【BELTAH BOT】\n👥 Mode »» ${mode}\n👤 Prefix »» ${prefix}`;
      client.sendMessage(client.user.id, { text: Texxt });
    }
  });

  client.ev.on("creds.update", saveCreds);

  if (autobio === 'TRUE') {
    setInterval(() => {
      const date = new Date();
      client.updateProfileStatus(`${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}.`);
    }, 10000);
  }

  client.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      if (autoviewstatus === 'TRUE' && mek.key?.remoteJid === "status@broadcast") {
        client.readMessages([mek.key]);
      }

      if (autolike === 'TRUE' && mek.key?.remoteJid === "status@broadcast") {
        const nickk = await client.decodeJid(client.user.id);
        if (!mek.status) {
          await client.sendMessage(mek.key.remoteJid, {
            react: { key: mek.key, text: '👻' }
          }, { statusJidList: [mek.key.participant, nickk] });
        }
      }

      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      let m = smsg(client, mek, store);
      const raven = require("./blacks");
      raven(client, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.public = true;
  client.serializeM = (m) => smsg(client, m, store);

  // Additional methods can stay untouched from original
  return client;
}


// ✅ Serve QR Code Image for Web
app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.get("/pairing", (req, res) => {
  const pairingFilePath = path.join(__dirname, "/sessions/creds.json");
  if (fs.existsSync(pairingFilePath)) {
    res.sendFile(pairingFilePath);
  } else {
    res.status(404).json({ message: "Pairing code not yet generated." });
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

startRaven();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});