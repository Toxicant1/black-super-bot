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

// 📦 BeltahBot-MD - Part 2: Command Handlers (Play, YTMP3, Sticker, etc.)

case 'play': { if (!text) return m.reply('🎵 Please provide a song name to play.'); const search = await yts(text); const song = search.all[0]; if (!song) return m.reply('❌ Song not found. Try a different title.');

let caption = 🎶 *Title:* ${song.title}\n🎥 *Views:* ${song.views}\n🕒 *Duration:* ${song.timestamp}\n📎 *Link:* ${song.url}; const thumbnail = await getBuffer(song.thumbnail); const audioUrl = await getYTMP3(song.url); // Assumes custom ytmp3 function

await client.sendMessage(m.chat, { image: thumbnail, caption: caption }, { quoted: m });

await client.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: ${song.title}.mp3 }, { quoted: m }); break; }

case 'ytmp3': { if (!args[0]) return m.reply('⚠️ Provide a YouTube URL.'); const audio = await getYTMP3(args[0]); if (!audio) return m.reply('❌ Could not download. Try again.'); client.sendMessage(m.chat, { audio: { url: audio }, mimetype: 'audio/mpeg', fileName: 'yt-audio.mp3' }, { quoted: m }); break; }

case 'sticker': { if (!quoted || !quoted.message) return m.reply('🖼️ Reply to an image or video.'); let mime = quoted.mtype; if (/image/.test(mime)) { let media = await quoted.download(); let sticker = await createSticker(media, { packname: "BELTAH", author: "Ishaq Ibrahim" }); client.sendMessage(m.chat, sticker, { quoted: m }); } else if (/video/.test(mime)) { let media = await quoted.download(); let sticker = await createSticker(media, { packname: "BELTAH", author: "Ishaq Ibrahim" }); client.sendMessage(m.chat, sticker, { quoted: m }); } else { m.reply('⚠️ Unsupported media type.'); } break; }

case 'lyrics': { if (!text) return m.reply('📝 Provide song name to fetch lyrics.'); const res = await fetch(https://api.lyrics.ovh/v1/${encodeURIComponent(text)}); const data = await res.json(); if (!data.lyrics) return m.reply('❌ Lyrics not found.'); m.reply(🎤 Lyrics for *${text}*:\n\n${data.lyrics}); break; }

case 'tiktok': { if (!args[0]) return m.reply('📹 Provide a TikTok URL.'); const info = await getTiktok(args[0]); if (!info || !info.video) return m.reply('❌ Failed to download TikTok.'); client.sendMessage(m.chat, { video: { url: info.video }, caption: '✅ TikTok downloaded' }, { quoted: m }); break; }

case 'ytmp4':
    if (!args[0]) return reply('🎬 Send a YouTube link bro!');
    try {
      const res = await fetch(`https://api.lolhuman.xyz/api/youtube?apikey=YOUR_API_KEY&url=${args[0]}`);
      const json = await res.json();
      if (!json.result || !json.result.link) return reply('❌ Video not found.');
      await client.sendMessage(m.chat, {
        video: { url: json.result.link },
        caption: `🎬 ${json.result.title}`
      }, { quoted: m });
    } catch (e) {
      reply('⚠️ Error fetching video.');
    }
    break;

  case 'song2':
  case 'play2':
    if (!text) return reply('🎵 What song should I fetch?');
    try {
      const res = await fetch(`https://api.lolhuman.xyz/api/ytplay2?apikey=YOUR_API_KEY&query=${text}`);
      const json = await res.json();
      if (!json.result || !json.result.audio) return reply('❌ Song not found.');
      await client.sendMessage(m.chat, {
        audio: { url: json.result.audio },
        mimetype: 'audio/mp4',
        ptt: false,
        fileName: json.result.title
      }, { quoted: m });
    } catch {
      reply('⚠️ Couldn’t download the song.');
    }
    break;

  case 'facebook':
  case 'fbdl':
    if (!args[0]) return reply('📱 Send a Facebook video link!');
    try {
      const res = await fetch(`https://api.lolhuman.xyz/api/facebook?apikey=YOUR_API_KEY&url=${args[0]}`);
      const json = await res.json();
      if (!json.result || !json.result.link) return reply('❌ Video not found.');
      await client.sendMessage(m.chat, {
        video: { url: json.result.link },
        caption: `📽 Facebook Video`
      }, { quoted: m });
    } catch {
      reply('⚠️ Failed to fetch FB video.');
    }
    break;

  case 'pinterest':
    if (!text) return reply('🔎 What should I search on Pinterest?');
    try {
      const res = await fetch(`https://api.lolhuman.xyz/api/pinterest?apikey=YOUR_API_KEY&query=${text}`);
      const json = await res.json();
      if (!json.result) return reply('❌ No images found.');
      const img = json.result[Math.floor(Math.random() * json.result.length)];
      await client.sendMessage(m.chat, { image: { url: img }, caption: `🖼 Pinterest result for: ${text}` }, { quoted: m });
    } catch {
      reply('⚠️ Error fetching Pinterest image.');
    }
    break;

  case 'twitter':
    if (!args[0]) return reply('🐦 Please send a Twitter video link.');
    try {
      const res = await fetch(`https://api.lolhuman.xyz/api/twitter?apikey=YOUR_API_KEY&url=${args[0]}`);
      const json = await res.json();
      if (!json.result || !json.result.link) return reply('❌ Not found.');
      await client.sendMessage(m.chat, { video: { url: json.result.link }, caption: '🐦 Twitter Video' }, { quoted: m });
    } catch {
      reply('⚠️ Error downloading Twitter video.');
    }
    break;
// ✅ YTMP3 COMMAND
case 'ytmp3':
  if (!text) return reply('🎵 Andika link ya YouTube!');
  reply('⏳ Downloading audio...');
  try {
    let res = await fetch(`https://vihangayt.me/download/ytmp3?url=${text}`);
    let json = await res.json();
    if (!json.status) return reply('❌ Hakuna audio ilipatikana.');
    client.sendMessage(m.chat, {
      audio: { url: json.data.url },
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m });
  } catch (e) {
    console.log(e);
    reply('⚠️ Error downloading MP3');
  }
  break;

// ✅ YTMP4 COMMAND
case 'ytmp4':
  if (!text) return reply('🎬 Andika link ya YouTube!');
  reply('⏳ Downloading video...');
  try {
    let res = await fetch(`https://vihangayt.me/download/ytmp4?url=${text}`);
    let json = await res.json();
    if (!json.status) return reply('❌ Hakuna video ilipatikana.');
    client.sendMessage(m.chat, {
      video: { url: json.data.url },
      caption: '✅ Downloaded by BeltahBot'
    }, { quoted: m });
  } catch (e) {
    console.log(e);
    reply('⚠️ Error downloading MP4');
  }
  break;

// ✅ PLAY COMMAND (Search Audio)
case 'play':
  if (!text) return reply('🎧 Andika jina ya wimbo!');
  reply('🔍 Searching song...');
  try {
    let res = await fetch(`https://vihangayt.me/search/ytplay?q=${text}`);
    let json = await res.json();
    if (!json.status) return reply('😢 Hakuna wimbo ilipatikana.');
    client.sendMessage(m.chat, {
      audio: { url: json.data.url },
      mimetype: 'audio/mpeg'
    }, { quoted: m });
  } catch (e) {
    console.log(e);
    reply('⚠️ Error searching song');
  }
  break;

// ✅ VIDEO COMMAND (Search Video)
case 'video':
  if (!text) return reply('🎞 Andika jina ya video!');
  reply('🔎 Inatafuta video...');
  try {
    let res = await fetch(`https://vihangayt.me/search/ytplayvid?q=${text}`);
    let json = await res.json();
    if (!json.status) return reply('😢 Hakuna video ilipatikana.');
    client.sendMessage(m.chat, {
      video: { url: json.data.url },
      caption: `🎥 Downloaded by BeltahBot`
    }, { quoted: m });
  } catch (e) {
    console.log(e);
    reply('⚠️ Error searching video');
  }
  break;

// ✅ FACEBOOK VIDEO
case 'fbdl':
  if (!text) return reply('📱 Andika FB video link!');
  reply('🔄 Downloading Facebook video...');
  try {
    let res = await fetch(`https://vihangayt.me/download/fb?url=${text}`);
    let json = await res.json();
    if (!json.status) return reply('❌ Hakuna video from Facebook.');
    client.sendMessage(m.chat, {
      video: { url: json.data.url },
      caption: '✅ Facebook video downloaded by BeltahBot'
    }, { quoted: m });
  } catch (e) {
    console.log(e);
    reply('⚠️ Error downloading Facebook video');
  }
  break;

// ✅ TIKTOK VIDEO
case 'tiktok':
case 'tt':
  if (!text) return reply('🎵 Andika link ya TikTok!');
  reply('⏳ Downloading TikTok video...');
  try {
    let res = await fetch(`https://vihangayt.me/download/tiktok?url=${text}`);
    let json = await res.json();
    if (!json.status) return reply('❌ Hakuna TT video ilipatikana.');
    client.sendMessage(m.chat, {
      video: { url: json.data.nowm },
      caption: '✅ TikTok video (No watermark) from BeltahBot'
    }, { quoted: m });
  } catch (e) {
    console.log(e);
    reply('⚠️ Error downloading TikTok video');
  }
  break;