// Final index.js with Smart Auto-DM for Black Beltah (Fixed Syntax Errors)

const { default: ravenConnect, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage, jidDecode, proto, getContentType, } = require("@whiskeysockets/baileys");

const pino = require("pino"); const { Boom } = require("@hapi/boom"); const fs = require("fs"); const path = require("path"); const axios = require("axios"); const express = require("express"); const chalk = require("chalk"); const FileType = require("file-type"); const figlet = require("figlet"); const { File } = require("megajs"); const app = express(); const _ = require("lodash"); let lastTextTime = 0; const messageDelay = 5000; const Events = require("./action/events"); const logger = pino({ level: "silent" }); const PhoneNumber = require("awesome-phonenumber"); const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require("./lib/ravenexif"); const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require("./lib/ravenfunc"); const { sessionName, session, mode, prefix, autobio, autolike, port, mycode, anticall, antiforeign, packname, autoviewstatus } = require("./set.js"); const makeInMemoryStore = require("./store/store.js"); const store = makeInMemoryStore({ logger: logger.child({ stream: "store" }) });

const color = (text, color) => (!color ? chalk.green(text) : chalk.keyword(color)(text));

async function authentication() { if (!fs.existsSync(__dirname + '/sessions/creds.json')) { if (!session) return console.log('Please add your session to SESSION env !!');

const sessdata = session.replace("BLACK MD;;;", '');
const filer = await File.fromURL(`https://mega.nz/file/${sessdata}`);

filer.download((err, data) => {
  if (err) throw err;

  fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
    console.log("Session downloaded successfully✅️");
    console.log("Connecting to WhatsApp ⏳️, Hold on for 3 minutes⌚️");
  });
});

} }

async function startRaven() { await authentication(); const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/sessions/"); const { version, isLatest } = await fetchLatestBaileysVersion(); console.log(using WA v${version.join(".")}, isLatest: ${isLatest}); console.log(color(figlet.textSync("BLACK-MD", { font: "Standard" }), "green"));

const client = ravenConnect({ logger: pino({ level: "silent" }), printQRInTerminal: false, browser: ["BLACK - AI", "Safari", "5.1.7"], auth: state, syncFullHistory: true, });

store.bind(client.ev);

client.ev.on("connection.update", (update) => { const { connection, lastDisconnect } = update; if (connection === "close") { if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startRaven(); } else if (connection === "open") { console.log(color("Congrats, BLACK MD has successfully connected to this server", "green")); console.log(color("Follow me on github as Blackie254", "red")); console.log(color("Text the bot number with menu to check my command list")); client.groupAcceptInvite("Fz3MiSzP8E3C1Q4Yf5thlw"); const Texxt = ✅ 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 » »【BLACK MD】\n👥 𝗠𝗼𝗱𝗲 »» ${mode}\n👤 𝗣𝗿𝗲𝗳𝗶𝘅 »» ${prefix}; client.sendMessage(client.user.id, { text: Texxt }); } });

client.ev.on("creds.update", saveCreds);

// ========== AUTO DM BLOCK ========== // const lastAutoDM = {}; const AUTO_DM_TIMEOUT = 2 * 60 * 60 * 1000; client.ev.on("messages.upsert", async (m) => { try { const msg = m.messages[0]; if (!msg.message || msg.key.fromMe || msg.key.remoteJid === "status@broadcast") return; const sender = msg.key.remoteJid; if (!sender.endsWith("@s.whatsapp.net")) return; const isGroup = sender.endsWith("@g.us"); if (isGroup) return;

const now = Date.now();
  const lastSent = lastAutoDM[sender] || 0;

  if (now - lastSent > AUTO_DM_TIMEOUT) {
    await client.sendMessage(sender, {
      text: `👾 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 𝗳𝗼𝗿 𝕴𝖘𝖍𝖆𝖖 𝕴𝖇𝖗𝖆𝖍𝖎𝖒... 🕵️‍♂️💀`
    });
    lastAutoDM[sender] = now;
  }
} catch (e) {
  console.log("❌ Auto DM error", e);
}

});

// ========== CONTINUE EXISTING BOT EVENTS BELOW ========== // // Messages, Groups, Anticall, etc. }

app.use(express.static("pixel")); app.get("/", (req, res) => res.sendFile(__dirname + "/index.html")); app.listen(port, () => console.log(Server listening on port http://localhost:${port}));

startRaven();

let file = require.resolve(__filename); fs.watchFile(file, () => { fs.unwatchFile(file); console.log(chalk.redBright(Update ${__filename})); delete require.cache[file]; require(file); });

