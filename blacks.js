// blacks.js - CORRECTED VERSION
const fs = require('fs');
const axios = require('axios');
const yts = require('yt-search');
const fetch = require('node-fetch');
const Client = require('genius-lyrics');
const Genius = new Client.Client();

module.exports = async (client, m, chatUpdate, store) => {
    try {
        const { prefix, mode } = require("./set.js"); // Ensure set.js is in the same directory

        let body = (typeof m.text === 'string' ? m.text : '');
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        const reply = (tek) => {
            client.sendMessage(m.chat, { text: tek }, { quoted: m });
        };

        function runtime(seconds) {
            seconds = Number(seconds);
            var d = Math.floor(seconds / (3600 * 24));
            var h = Math.floor(seconds % (3600 * 24) / 3600);
            var m = Math.floor(seconds % 3600 / 60);
            var s = Math.floor(seconds % 60);
            var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
            var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
            var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
            var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
            return dDisplay + hDisplay + mDisplay + sDisplay;
        }

        switch (command) {
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
╚════════════════════════════╝

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
🔎 ytsearch - Youtube
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

            case "chat":
                if (!text) return reply("Type something to chat with AI.");
                let res = await axios.get(`https://api.akuari.my.id/ai/gbard?chat=${encodeURIComponent(text)}`);
                client.sendMessage(m.chat, { text: res.data.respon }, { quoted: m });
                break;

            case "play2": {
                if (!text) return reply("Provide song name.");
                let { videos } = await yts(text);
                if (!videos.length) return reply("No video found.");
                const url = videos[0].url;
                const data = await fetchJson(`https://api.dreaded.site/api/ytdl/audio?url=${url}`);
                const { title, url: audioUrl } = data.result;
                await client.sendMessage(m.chat, {
                    document: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title}.mp3`,
                    caption: `🎵 *${title}*\nPowered by BeltahBot`,
                }, { quoted: m });
                break;
            }

            case "lyrics2": {
                if (!text) return reply("Type song title.");
                const searches = await Genius.songs.search(text);
                if (!searches.length) return reply("No lyrics found.");
                const lyrics = await searches[0].lyrics();
                client.sendMessage(m.chat, { text: lyrics }, { quoted: m });
                break;
            }

            case "vv":
            case "retrieve": {
                if (!m.quoted) return reply("Quote a viewonce message.");
                const quoted = m.msg?.contextInfo?.quotedMessage;
                if (quoted?.imageMessage) {
                    const img = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
                    client.sendMessage(m.chat, { image: { url: img }, caption: "📸 ViewOnce Image" }, { quoted: m });
                } else if (quoted?.videoMessage) {
                    const vid = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
                    client.sendMessage(m.chat, { video: { url: vid }, caption: "🎥 ViewOnce Video" }, { quoted: m });
                } else {
                    reply("The quoted message is not a view-once image or video.");
                }
                break;
            }

            case "bible":
                reply("📖 John 3:16 — For God so loved the world...");
                break;

            case "quran":
                reply("📘 Surah Al-Fatiha — بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ...");
                break;
            
            // Add other commands here
            default:
                // No action for unknown commands or non-command messages
                break;
        }

    } catch (err) {
        console.error("Error in blacks.js message handler:", err);
    }
};
