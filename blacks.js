/*

BeltahBot-MD Handler: Part 1 (Lines 1-1000)

Author: Ishaq Ibrahim

Contact: isaac0maina@gmail.com

GitHub: https://github.com/Toxicant1/black-super-bot.git

Panel: https://blacks-pair.onrender.com */


const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require("@whiskeysockets/baileys"); const fs = require("fs"); const pino = require("pino"); const chalk = require("chalk"); const axios = require("axios"); const moment = require("moment-timezone"); const { exec } = require("child_process");

// Auto features let autobio = true; let autoreact = true; let antidelete = true; let viewonceunlock = true; let viewstatus = true;

// BOT INFO const botName = "𝐁𝐋𝐀𝐂𝐊 𝐁𝐄𝐋𝐓𝐀𝐇 𝐁𝐎𝐓"; const ownerName = "𝕴𝖘𝖍𝖆𝖖 𝕴𝖇𝖗𝖆𝖍𝖎𝖒"; const ownerNum = "254115172722"; const aliveBanner = "https://raw.githubusercontent.com/Toxicant1/black-super-bot/main/blackmachant.jpg"; const aliveAudio = fs.readFileSync("./Media/Ava.mp3");

// Util function getGreeting() { const hour = moment().tz("Africa/Nairobi").hour(); if (hour < 12) return "Good Morning ☀️"; if (hour < 18) return "Good Afternoon 🌞"; return "Good Evening 🌙"; }

// Command Handler async function BeltahBotHandler(m, client) { const text = m.body || m.message?.conversation || ""; const command = text.trim().split(/ +/).shift().toLowerCase();

switch(command) {

    case "menu":
    case "!menu":
    case ".menu": {
        const menuText = `

╔══✪〘 ${botName} 〙✪══╗ ║ 🧑‍💻 Owner: ${ownerName} ║ ☎️ Phone: ${ownerNum} ║ 🌐 GitHub: github.com/Toxicant1 ║ 💌 Email: isaac0maina@gmail.com ║ 🕒 Time: ${moment().tz("Africa/Nairobi").format("hh:mm:ss A")} ╚════════════════════╝

🌟 Available Commands:

.play song name

.ytmp3 link

.ytmp4 link

.sticker (reply img/vid)

.photo

.quote

.alive


🛠 Type a command to continue. `; client.sendMessage(m.chat, { image: { url: aliveBanner }, caption: menuText, fileLength: "9999999999" }, { quoted: m }); } break;

case "alive": {
        client.sendMessage(m.chat, {
            audio: aliveAudio,
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: m });
    }
    break;

    case "play": {
        const query = text.split(/ +/).slice(1).join(" ");
        if (!query) return client.sendMessage(m.chat, { text: "🎵 Type a song name." }, { quoted: m });
        const search = await axios.get(`https://api.dl-sound.cloud/yt/playmp3?q=${encodeURIComponent(query)}`);
        let { title, url, audio } = search.data;
        client.sendMessage(m.chat, {
            audio: { url: audio },
            mimetype: 'audio/mpeg',
            fileName: title + ".mp3"
        }, { quoted: m });
    }
    break;

    case "ytmp3": {
        const link = text.split(/ +/)[1];
        if (!link) return client.sendMessage(m.chat, { text: "🔗 Paste YouTube link." }, { quoted: m });
        const info = await axios.get(`https://api.dl-sound.cloud/yt/mp3?url=${link}`);
        client.sendMessage(m.chat, {
            audio: { url: info.data.audio },
            mimetype: 'audio/mpeg',
            fileName: info.data.title + ".mp3"
        }, { quoted: m });
    }
    break;

    case "ytmp4": {
        const link = text.split(/ +/)[1];
        if (!link) return client.sendMessage(m.chat, { text: "🔗 Paste YouTube link." }, { quoted: m });
        const info = await axios.get(`https://api.dl-sound.cloud/yt/mp4?url=${link}`);
        client.sendMessage(m.chat, {
            video: { url: info.data.video },
            mimetype: 'video/mp4',
            fileName: info.data.title + ".mp4"
        }, { quoted: m });
    }
    break;

    case "sticker": {
        if (!m.quoted || !m.quoted.mimetype) return client.sendMessage(m.chat, { text: "🖼️ Reply an image or short video." }, { quoted: m });
        let buffer = await m.quoted.download();
        client.sendMessage(m.chat, {
            sticker: buffer
        }, { quoted: m });
    }
    break;

    case "photo": {
        client.sendMessage(m.chat, {
            image: { url: aliveBanner },
            caption: `Here’s your photo 🖼️`
        }, { quoted: m });
    }
    break;

    case "quote": {
        const quote = await axios.get("https://api.quotable.io/random");
        client.sendMessage(m.chat, {
            text: `💬 *${quote.data.content}*\n- ${quote.data.author}`
        }, { quoted: m });
    }
    break;

}

// AUTOBIO
if (autobio) {
    const bio = `🤖 ${moment().tz("Africa/Nairobi").format("hh:mm A")} | Beltah Active!`;
    await client.updateProfileStatus(bio).catch(() => {});
}

// ANTIDELETE
if (antidelete) {
    client.ev.on("messages.delete", async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.fromMe) continue;
            client.sendMessage(msg.key.remoteJid, { text: `🚫 *AntiDelete:* Message deleted:

${msg.message?.conversation || "Media"}` }); } }); }

// AUTOREACT
if (autoreact) {
    client.sendMessage(m.chat, { react: { text: "👍", key: m.key }});
}

// VIEW ONCE
if (viewonceunlock && m.message?.viewOnceMessageV2) {
    const original = m.message.viewOnceMessageV2.message;
    client.sendMessage(m.chat, original, { quoted: m });
}

}

module.exports = BeltahBotHandler;

