/* If it works, don't Fix it */ const { default: ravenConnect, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage, jidDecode, proto, getContentType, } = require("@whiskeysockets/baileys");

const pino = require("pino"); const { Boom } = require("@hapi/boom"); const fs = require("fs"); const path = require('path'); const axios = require("axios"); const express = require("express"); const chalk = require("chalk"); const FileType = require("file-type"); const figlet = require("figlet"); const { File } = require('megajs'); const app = express(); const _ = require("lodash"); let lastTextTime = 0; const messageDelay = 5000; const Events = require('./action/events'); const logger = pino({ level: 'silent' }); const PhoneNumber = require("awesome-phonenumber"); const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/ravenexif'); const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/ravenfunc'); const { sessionName, session, mode, prefix, autobio, autolike, port, mycode, anticall, antiforeign, packname, autoviewstatus } = require("./set.js"); const makeInMemoryStore = require('./store/store.js'); const store = makeInMemoryStore({ logger: logger.child({ stream: 'store' }) }); const color = (text, color) => !color ? chalk.green(text) : chalk.keyword(color)(text);

async function authentication() { if (!fs.existsSync(__dirname + '/sessions/creds.json')) { if (!session) return console.log('Please add your session to SESSION env !!') const sessdata = session.replace("BELTAH;;;", ''); const filer = await File.fromURL(https://mega.nz/file/${sessdata}) filer.download((err, data) => { if (err) throw err fs.writeFile(__dirname + '/sessions/creds.json', data, () => { console.log("Session downloaded successfully✅️") console.log("Connecting to WhatsApp ⏳️, Hold on for 3 minutes⌚️") }) }) } }

async function startRaven() { await authentication(); const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/'); const { version, isLatest } = await fetchLatestBaileysVersion(); console.log(using WA v${version.join(".")}, isLatest: ${isLatest}); console.log(color(figlet.textSync("BELTAH-BOT", { font: "Standard" }), "green"));

const client = ravenConnect({ logger: pino({ level: "silent" }), printQRInTerminal: false, browser: ["BELTAH-BOT", "Chrome", "110.0.0.0"], auth: state, syncFullHistory: true, });

store.bind(client.ev);

client.ev.on('connection.update', (update) => { const { connection, lastDisconnect } = update; if (connection === 'close') { if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) { startRaven(); } } else if (connection === 'open') { console.log(color("✅ BeltahBot connected successfully", "green")); console.log(color("📌 Owner: Ishaq Ibrahim", "blue")); console.log(color("🌍 Deploy: https://beltah-md-d882.onrender.com", "magenta")); } });

client.ev.on("creds.update", saveCreds);

// additional event logic follows... }

app.use(express.static("pixel")); app.get("/", (req, res) => res.sendFile(__dirname + "/index.html")); app.listen(port, () => console.log(🚀 BeltahBot running on https://beltah-md-d882.onrender.com));

startRaven();

let file = require.resolve(__filename); fs.watchFile(file, () => { fs.unwatchFile(file); console.log(chalk.redBright(Update ${__filename})); delete require.cache[file]; require(file); });

