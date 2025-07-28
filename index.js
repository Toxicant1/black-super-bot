/* If it works, don't  Fix it */
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

const fs = require("fs");
const path = require("path");
const pino = require("pino");
const chalk = require("chalk");
const figlet = require("figlet");
const axios = require("axios");
const express = require("express");
const FileType = require("file-type");
const { File } = require("megajs");
const PhoneNumber = require("awesome-phonenumber");

const { sessionName, session, mode, prefix, autobio, autolike, port, mycode, anticall, antiforeign, packname, autoviewstatus } = require("./set.js");

const Events = require('./action/events');
const { smsg, getBuffer } = require('./lib/ravenfunc');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/ravenexif');

const makeInMemoryStore = require('./store/store.js'); 
const store = makeInMemoryStore({ logger: pino({ level: 'silent' }).child({ stream: 'store' }) });

const app = express();
let lastTextTime = 0;
const messageDelay = 5000;

const color = (text, color) => !color ? chalk.green(text) : chalk.keyword(color)(text);

async function authentication() {
  if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
    if (!session) return console.log('Please add your session to SESSION env !!');
    const sessdata = session.replace("LOST-BOY MD;;;", '');
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
  const { version } = await fetchLatestBaileysVersion();

  console.log(`using WA v${version.join(".")}`);
  console.log(color(figlet.textSync("LOST-BOY", { font: "Standard" }), "green"));

  const client = ravenConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["LOST-BOY - AI", "Safari", "5.1.7"],
    auth: state,
    syncFullHistory: true,
  });

  store.bind(client.ev);

  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) return startRaven();
    if (connection === "open") {
      console.log(color("LOST-BOY MD connected ✅", "green"));
      client.sendMessage(client.user.id, {
        text: `✅ Connected to LOST-BOY MD\n👥 Mode: ${mode}\n👤 Prefix: ${prefix}`
      });
    }
  });

  client.ev.on("creds.update", saveCreds);

  if (autobio === "TRUE") {
    setInterval(() => {
      const date = new Date();
      const bio = `${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi' })}.`;
      client.updateProfileStatus(bio);
    }, 10 * 1000);
  }

  client.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      if (autoviewstatus === 'TRUE' && mek.key.remoteJid === "status@broadcast") {
        client.readMessages([mek.key]);
      }

      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      let m = smsg(client, mek, store);
      const raven = require("./blacks");
      raven(client, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  // Optional error handling
  process.on("unhandledRejection", (reason) => {
    console.log("Unhandled Rejection:", reason);
  });

  client.public = true;
  client.serializeM = (m) => smsg(client, m, store);
}

app.use(express.static("pixel"));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

startRaven();

fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(chalk.redBright(`Updated ${__filename}`));
  delete require.cache[require.resolve(__filename)];
  require(__filename);
});