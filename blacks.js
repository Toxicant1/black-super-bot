// BeltahBot-MD: Unified Script with ARIA Menu
case "menu":
await client.sendMessage(m.chat, {
  audio: fs.readFileSync('./Media/ponk.mp3'),
  mimetype: "audio/mp4",
  ptt: true
}, { quoted: m });

let cap = `
╔═════════════════════════════╗
♤ 𝐁𝐋𝐀𝐂𝐊𝐁𝐄𝐋𝐓𝐀𝐇 - 𝐀𝐑𝐈𝐀 𝐌𝐄𝐍𝐔 ♤
◇ Stylish WhatsApp AI Chatbot ◇
♡ Powered by Ishaq Ibrahim ♡
╚═════════════════════════════╝

╔═══════♧ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 ♧═══════╗
👤 Name: ${m.pushName}
🧠 Mode: ${mode}
⏳ Uptime: ${runtime(process.uptime())}
🤖 Bot: 𝐁𝐋𝐀𝐂𝐊𝐁𝐄𝐋𝐓𝐀𝐇-MD
╚════════════════════════════╝

╔═══════♤ 𝗠𝗘𝗗𝗜𝗔 ♤════════╗
🎵 play2 - YouTube Music DL
📃 lyrics2 - Song Lyrics
🧷 vv - ViewOnce retriever
🎭 sticker - Image to Sticker
╚════════════════════════════╝

╔═══════◇ 𝗔𝗜 & 𝗚𝗔𝗠𝗘𝗦 ◇═════╗
👨‍💻 chat - AI Hinglish Chat
📥 downloader - TikTok/IG/FB
🧠 trivia - Fun Questions
🎯 guess - Guess Game
╚════════════════════════════╝

╔═══════♧ 𝗚𝗥𝗢𝗨𝗣 𝗖𝗧𝗥𝗟 ♧═══════╗
👑 admin - Admin Control
🏷 tagall - Mention All
🛑 antilink - Block links
👋 welcome - Enable Welcome
╚════════════════════════════╝

╔═══════♤ 𝗨𝗧𝗜𝗟𝗦 ♤══════════╗
📖 bible - Bible Verse
📘 quran - Quran Verse
🔎 ytsearch - YouTube Search
💬 say - Text to Speech
╚════════════════════════════╝

╔═══════◇ 𝗢𝗪𝗡𝗘𝗥 & 𝗦𝗬𝗦 ◇═══════╗
🔒 lock - Admin Only Mode
💾 save - Save Chat
🗑️ clearall - Wipe Data
🤖 status-mode - Toggle Bio
╚════════════════════════════╝

💡 _Use commands with "." e.g., .play2 Alan Walker_
`;

client.sendMessage(m.chat, {
  image: fs.readFileSync('./Media/blackmachant.jpg'),
  caption: cap,
}, { quoted: m });
break;

// ========== AI CHAT ==========
case "chat":
  if (!text) return reply("Type something to chat with AI.");
  const axios = require("axios");
  let res = await axios.get(`https://api.akuari.my.id/ai/gbard?chat=${encodeURIComponent(text)}`);
  client.sendMessage(m.chat, { text: res.data.respon }, { quoted: m });
break;

// ========== PLAY MUSIC ==========
case "play2": {
  const yts = require("yt-search");
  if (!text) return reply("Provide song name.");
  let { videos } = await yts(text);
  if (!videos.length) return reply("No video found.");
  const url = videos[0].url;
  const fetch = require("node-fetch");
  const data = await fetchJson(`https://api.dreaded.site/api/ytdl/audio?url=${url}`);
  const { title, url: audioUrl } = data.result;
  await client.sendMessage(m.chat, {
    document: { url: audioUrl },
    mimetype: "audio/mpeg",
    fileName: `${title}.mp3`,
    caption: `🎵 *${title}*\nPowered by BeltahBot`,
  }, { quoted: m });
}
break;

// ========== LYRICS ==========
case "lyrics2": {
  if (!text) return reply("Type song title.");
  const Client = require("genius-lyrics");
  const Genius = new Client.Client();
  const searches = await Genius.songs.search(text);
  const lyrics = await searches[0].lyrics();
  client.sendMessage(m.chat, { text: lyrics }, { quoted: m });
}
break;

// ========== VV ViewOnce ==========
case "vv": case "retrieve": {
  if (!m.quoted) return m.reply("Quote a viewonce message.");
  const quoted = m.msg?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const img = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    client.sendMessage(m.chat, { image: { url: img }, caption: "📸 ViewOnce Image" }, { quoted: m });
  }
  if (quoted?.videoMessage) {
    const vid = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
    client.sendMessage(m.chat, { video: { url: vid }, caption: "🎥 ViewOnce Video" }, { quoted: m });
  }
}
break;

// ========== BIBLE ==========
case "bible":
  reply("📖 John 3:16 — For God so loved the world...");
break;

// ========== QURAN ==========
case "quran":
  reply("📘 Surah Al-Fatiha — بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ...");
break;

// ========== AUTOBIO ==========
if (autobio === 'TRUE') {
  setInterval(() => {
    const date = new Date();
    const statuses = [
      "𝐁𝐋𝐀𝐂𝐊𝐁𝐄𝐋𝐓𝐀𝐇 says hi 👋",
      "Chat with AI 🤖",
      "Music is life 🎵",
      "Learning never stops 📚",
      "Shujaa never sleeps 😎"
    ];
    const rand = statuses[Math.floor(Math.random() * statuses.length)];
    client.updateProfileStatus(`${rand} | ${date.toLocaleTimeString('en-KE')}`);
  }, 60000 * 5); // Every 5 minutes
}

// ========== AUTO STATUS ROTATION ==========
if (autoviewstatus === 'TRUE') {
  client.ev.on("messages.upsert", async (chatUpdate) => {
    const mek = chatUpdate.messages[0];
    if (mek.key?.remoteJid === "status@broadcast") {
      client.readMessages([mek.key]);
    }
  });
}

// ========== AUTO STATUS LIKE ==========
if (autolike === 'TRUE') {
  const emojis = ["✌️", "😹", "👻", "💖", "🌹", "🌍", "♨️", "🔥", "🎭", "📎", "🥰", "😊", "🙊", "👀", "💀", "🕵‍♂️", "😱", "🐀"];
  client.ev.on("messages.upsert", async (chatUpdate) => {
    const mek = chatUpdate.messages[0];
    if (mek.key?.remoteJid === "status@broadcast") {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      await client.sendMessage(mek.key.remoteJid, {
        react: { key: mek.key, text: emoji }
      });
    }
  });
}

// ========== TYPING & RECORDING PRESENCE ==========
let statusIndex = 0;
const statusTypes = ['typing', 'recording'];
setInterval(() => {
  const statusType = statusTypes[statusIndex % statusTypes.length];
  client.sendPresenceUpdate(statusType, client.user.id);
  statusIndex++;
}, 5 * 60 * 1000); // 5 mins