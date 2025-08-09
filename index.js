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

  if (autobio === 'TRUE') {
    const boldStyle = (text) => {
      const scriptBoldMap = {
        'A': '𝔄', 'B': '𝔅', 'C': 'ℭ', 'D': '𝔇', 'E': '𝔈', 'F': '𝔉', 'G': '𝔊',
        'H': 'ℌ', 'I': 'ℑ', 'J': '𝔍', 'K': '𝔎', 'L': '𝔏', 'M': '𝔐', 'N': '𝔑',
        'O': '𝔒', 'P': '𝔓', 'Q': '𝔔', 'R': 'ℜ', 'S': '𝔖', 'T': '𝔗', 'U': '𝔘',
        'V': '𝔙', 'W': '𝔚', 'X': '𝔛', 'Y': '𝔜', 'Z': 'ℨ',
        'a': '𝔞', 'b': '𝔟', 'c': '𝔠', 'd': '𝔡', 'e': '𝔢', 'f': '𝔣', 'g': '𝔤',
        'h': '𝔥', 'i': '𝔦', 'j': '𝔧', 'k': '𝔨', 'l': '𝔩', 'm': '𝔪', 'n': '𝔫',
        'o': '𝔬', 'p': '𝔭', 'q': '𝔮', 'r': '𝔯', 's': '𝔰', 't': '𝔱', 'u': '𝔲',
        'v': '𝔳', 'w': '𝔴', 'x': '𝔵', 'y': '𝔶', 'z': '𝔷',
        ' ': ' '
      };
      return text.split('').map(c => scriptBoldMap[c] || c).join('');
    };

    const darkQuotes = [
      "“We are all shadows cast by the unknown.”",
      "“In silence, secrets scream the loudest.”",
      "“Beneath the code lies a ghost’s whisper.”",
      "“Entropy feeds the machine’s heartbeat.”",
      "“Data never sleeps; it just hides.”"
    ];

    const avgQuotes = [
      "“Change is the only constant in the digital realm.”",
      "“Logic is the language of the universe.”",
      "“Behind every error is a hidden lesson.”",
      "“The future is written in algorithms.”",
      "“Connection is more than just bytes.”"
    ];

    const techWords = [
      "Neural Protocol", "Quantum Firewall", "Zero-Day Loop", 
      "Bitstream Nexus", "Cipher Cascade", "Binary Phantom", 
      "Darknet Pulse", "Synthetic Encryption"
    ];

    const randomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];

    setInterval(() => {
      const date = new Date();
      const optionsDate = { timeZone: 'Africa/Nairobi', year:'numeric', month:'2-digit', day:'2-digit' };
      const dateString = date.toLocaleDateString('en-US', optionsDate);
      const timeString = date.toLocaleTimeString('en-US', { timeZone: 'Africa/Nairobi', hour12: false });

      const botNameStyled = boldStyle("Black Merchant");
      const calendarEmoji = "📅";
      const clockEmoji = "⏰";
      const techEmoji = "🖥️";

      const darkQuote = randomFromArray(darkQuotes);
      const avgQuote = randomFromArray(avgQuotes);
      const techWord = randomFromArray(techWords);

      const bioText = `${botNameStyled} | ${calendarEmoji} ${dateString} | ${clockEmoji} ${timeString}\n`+
                      `🖤 Dark Quote: ${darkQuote}\n`+
                      `💡 Avg Quote: ${avgQuote}\n`+
                      `${techEmoji} Tech: ${techWord}`;

      client.updateProfileStatus(bioText);
    }, 10 * 1000);
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
    return await client.sendMessage(jid, {
      image: buffer,
      caption: caption,
      ...options,
    }, { quoted });
  };

  client.sendVideo = async (jid, path, caption = "", quoted = "", gif = false, options) => {
    let buffer = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], "base64")
      : /^https?:\/\//.test(path)
      ? await getBuffer(path)
      : fs.existsSync(path)
      ? fs.readFileSync(path)
      : Buffer.alloc(0);
    return await client.sendMessage(jid, {
      video: buffer,
      caption: caption,
      gifPlayback: gif,
      ...options,
    }, { quoted });
  };

  client.sendAudio = async (jid, path, quoted = "", ptt = false, options) => {
    let buffer = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], "base64")
      : /^https?:\/\//.test(path)
      ? await getBuffer(path)
      : fs.existsSync(path)
      ? fs.readFileSync(path)
      : Buffer.alloc(0);
    return await client.sendMessage(jid, {
      audio: buffer,
      ptt: ptt,
      ...options,
    }, { quoted });
  };

  client.sendText = async (jid, text, quoted = "", options) => {
    return await client.sendMessage(jid, {
      text: text,
      ...options,
    }, { quoted });
  };

  client.sendButtonText = async (jid, buttons = [], text, footer, quoted = "", options = {}) => {
    let buttonMessage = {
      text: text,
      footer: footer,
      buttons: buttons,
      headerType: 1,
    };
    return await client.sendMessage(jid, buttonMessage, { quoted, ...options });
  };

  client.sendListMsg = async (jid, text = '', footer = '', title = '', butText = '', sections = [], quoted) => {
    let listMsg = {
      text,
      footer,
      title,
      buttonText: butText,
      sections,
      headerType: 1
    };
    return await client.sendMessage(jid, listMsg, { quoted });
  };

  client.sendSticker = async (jid, path, quoted, options = {}) => {
    let buffer = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], "base64