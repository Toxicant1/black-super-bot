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
//const authentication = require('./action/auth');
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/ravenexif');
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/ravenfunc');
const { sessionName, session, mode, prefix, autobio, autolike, port, mycode, anticall, antiforeign, packname, autoviewstatus } = require("./set.js");
const makeInMemoryStore = require('./store/store.js'); 
const store = makeInMemoryStore({ logger: logger.child({ stream: 'store' }) });
//const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

async function authentication() {
  if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
    if(!session) return console.log('Please add your session to SESSION env !!')
const sessdata = session.replace("BLACK MD;;;", '');
const filer = await File.fromURL(`https://mega.nz/file/${sessdata}`)
filer.download((err, data) => {
if(err) throw err
fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
console.log("Session downloaded successfully✅️")
console.log("Connecting to WhatsApp ⏳️, Hold on for 3 minutes⌚️")
})})}
}

async function startRaven() {
       await authentication();  
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
  console.log(
    color(
      figlet.textSync("BLACK-MD", {
        font: "Standard",
        horizontalLayout: "default",
        vertivalLayout: "default",
        whitespaceBreak: false,
      }),
      "green"
    )
  );

  const client = ravenConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["BLACK - AI", "Safari", "5.1.7"],
    auth: state,
    syncFullHistory: true,
  });

store.bind(client.ev);

client.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
  if (connection === 'close') {
  if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
startRaven()
  }
  } else if (connection === 'open') {
      console.log(color("Congrats, BLACK MD has successfully connected to this server", "green"));
      console.log(color("Follow me on github as Blackie254", "red"));
      console.log(color("Text the bot number with menu to check my command list"));
      client.groupAcceptInvite('EaVXKzZlIu1IWXo2eI8lUm');
      const Texxt = `✅ 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 » »【BLACK MD】\n`+`👥 𝗠𝗼𝗱𝗲 »» ${mode}\n`+`👤 𝗣𝗿𝗲𝗳𝗶𝘅 »» ${prefix}`
      client.sendMessage(client.user.id, { text: Texxt });
    }
  });

    client.ev.on("creds.update", saveCreds);

  // --- Fraktur map and conversion function for bold stylized bio ---
  const frakturMap = {
    'A': '𝕬', 'B': '𝕭', 'C': '𝕮', 'D': '𝕯', 'E': '𝕰', 'F': '𝕱', 'G': '𝕲',
    'H': '𝕳', 'I': '𝕴', 'J': '𝕵', 'K': '𝕶', 'L': '𝕷', 'M': '𝕸', 'N': '𝕹',
    'O': '𝕺', 'P': '𝕻', 'Q': '𝕼', 'R': '𝕽', 'S': '𝕾', 'T': '𝕿', 'U': '𝖀',
    'V': '𝖁', 'W': '𝖂', 'X': '𝖃', 'Y': '𝖄', 'Z': '𝖅',
    'a': '𝖆', 'b': '𝖇', 'c': '𝖈', 'd': '𝖉', 'e': '𝖊', 'f': '𝖋', 'g': '𝖌',
    'h': '𝖍', 'i': '𝖎', 'j': '𝖏', 'k': '𝖐', 'l': '𝖑', 'm': '𝖒', 'n': '𝖓',
    'o': '𝖔', 'p': '𝖕', 'q': '𝖖', 'r': '𝖗', 's': '𝖘', 't': '𝖙', 'u': '𝖚',
    'v': '𝖛', 'w': '𝖜', 'x': '𝖝', 'y': '𝖞', 'z': '𝖟',
    ' ': ' '
  };
  function toFraktur(text) {
    return text.split('').map(c => frakturMap[c] || c).join('');
  }

  if (autobio === 'TRUE') {
    setInterval(() => {
      const date = new Date();
      // Compose bio with bold Fraktur bot name, clock emoji, and dark + tech quotes
      const botName = toFraktur("Black Merchant");
      const timeString = date.toLocaleTimeString('en-US', { timeZone: 'Africa/Nairobi', hour12: false });
      const dayString = date.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', weekday: 'long' });
      const quotes = [
        "☠️ Did you know? \"The shadows know your secrets.\"",
        "⚙️ System check: 01101001 01101110 01110100 01100101 01101100 01101100 01101001 01100111 01100101 01101110 01100011 01100101",
        "🕯️ Dark truth: \"Silence screams louder than words.\"",
        "💻 Kernel panic: Unexpected shutdown imminent.",
        "🌑 Night falls but your fears stay awake."
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      const bio = `${botName}  🕰️ ${timeString}  |  ${dayString}\n${randomQuote}`;

      client.updateProfileStatus(bio).catch(console.error);
    }, 5 * 1000); // update every 5 seconds for fresh time
  }


  client.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      if (autoviewstatus === 'TRUE' && mek.key && mek.key.remoteJid === "status@broadcast") {
        client.readMessages([mek.key]);
      }

      if (autolike === 'TRUE' && mek.key && mek.key.remoteJid === "status@broadcast") {
    const nickk = await client.decodeJid(client.user.id);
    console.log('Decoded JID:', nickk);
    if (!mek.status) {
        console.log('Sending reaction to:', mek.key.remoteJid);
        await client.sendMessage(mek.key.remoteJid, { react: { key: mek.key, text: '😱' } }, { statusJidList: [mek.key.participant, nickk] });
        console.log('Reaction sent');
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

  // Handle error
  const unhandledRejections = new Map();
  process.on("unhandledRejection", (reason, promise) => {
    unhandledRejections.set(promise, reason);
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("rejectionHandled", (promise) => {
    unhandledRejections.delete(promise);
  });
  process.on("Something went wrong", function (err) {
    console.log("Caught exception: ", err);
  });

  // Setting
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = client.decodeJid(contact.id);
      if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
    }
  });

  client.ev.on("group-participants.update", async (update) => {
        if (antiforeign === 'TRUE' && update.action === "add") {
            for (let participant of update.participants) {
                const jid = client.decodeJid(participant);
                const phoneNumber = jid.split("@")[0];
                    // Extract phone number
                if (!phoneNumber.startsWith(mycode)) {
                        await client.sendMessage(update.id, {
                    text: "Your Country code is not allowed to join this group !",
                    mentions: [jid]
                });
                    await client.groupParticipantsUpdate(update.id, [jid], "remove");
                    console.log(`Removed ${jid} from group ${update.id} because they are not from ${mycode}`);
                }
            }
        }
        Events(client, update); // Call existing event handler
    });

 client.ev.on('call', async (callData) => {
    if (anticall === 'TRUE') {
      const callId = callData[0].id;
      const callerId = callData[0].from;

      await client.rejectCall(callId, callerId);
            const currentTime = Date.now();
      if (currentTime - lastTextTime >= messageDelay) {
        await client.sendMessage(callerId, {
          text: "Anticall is active, Only texts are allowed"
        });
        lastTextTime = currentTime;
      } else {
        console.log('Message skipped to prevent overflow');
      }
    }
    });


  client.getName = (jid, withoutContact = false) => {
    let id = client.decodeJid(jid);
    withoutContact = client.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = client.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? {
              id,
              name: "WhatsApp",
            }
          : id === client.decodeJid(client.user.id)
          ? client.user
          : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
  };

  client.setStatus = (status) => {
    client.query({
      tag: "iq",
      attrs: {
        to: "@s.whatsapp.net",
        type: "set",
        xmlns: "status",
      },
      content: [
        {
          tag: "status",
          attrs: {},
          content: Buffer.from(status, "utf-8"),
        },
      ],
    });
    return status;
  };

  client.public = true;
  client.serializeM = (m) => smsg(client, m, store);

 const getBuffer = async (url, options) => {
    try {
      options ? options : {};
      const res = await axios({
        method: "get",
        url,
        headers: {
          DNT: 1,
          "Upgrade-Insecure-Request": 1,
        },
        ...options,
        responseType: "arraybuffer",
      });
      return res.data;
    } catch (err) {
      return err;
    }
  };

  client.sendImage = async (jid, path, caption = "", quoted = "", options) => {
    let buffer = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], "base64")
      : /^https?:\/\//.test(path)
      ? await getBuffer(path)
      : fs.existsSync(path)
      ? fs.readFileSync(path)
      : Buffer.alloc(0);
    return await client.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
  };

  client.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
    let types = await client.getFile(PATH, true);
    let { filename, size, ext, mime, data } = types;
    let type = '', mimetype = mime, pathFile = filename;
    if (options.asDocument) type = 'document';
    if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require('./lib/ravenexif.js');
      let media = { mimetype: mime, data };
      pathFile =