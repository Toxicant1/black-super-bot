// blacks.js - CORRECTED AND ENHANCED VERSION
const fs = require('fs');
const axios = require('axios');
const yts = require('yt-search');
const fetch = require('node-fetch'); // Keeping node-fetch as it's used by fetchJson
const Client = require('genius-lyrics');
const Genius = new Client.Client();

// Helper function for fetch with JSON parsing (assuming you have one, or define it here)
// If fetchJson is not defined elsewhere, you'll need this:
const fetchJson = async (url, options) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('fetchJson error:', error);
        throw error;
    }
};

// --- Bot Presence Functions ---
let presenceInterval;
let presenceIndex = 0;
const presences = ['available', 'composing', 'recording']; // 'available' for online, 'composing' for typing, 'recording' for recording audio

async function updateBotPresence(client, m) {
    if (presenceInterval) clearInterval(presenceInterval); // Clear any existing interval

    presenceInterval = setInterval(async () => {
        const currentPresence = presences[presenceIndex];
        // console.log(`Setting presence to: ${currentPresence}`); // For debugging
        await client.sendPresenceUpdate(currentPresence, m.chat);

        presenceIndex = (presenceIndex + 1) % presences.length; // Cycle through presences
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
}

// --- Auto Bio Update Function ---
async function updateBotBio(client, botName) {
    try {
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const newBio = `${botName} says hi at ${currentTime}`;
        await client.updateProfileStatus(newBio); // Baileys function to update status
        console.log(`Bot bio updated to: ${newBio}`);
    } catch (e) {
        console.error("Failed to update bot bio:", e);
    }
}

// You might call updateBotBio periodically using setInterval in your main bot file
// For example, in your main index.js:
// setInterval(() => updateBotBio(client, "𝐁𝐋𝐀𝐂𝐊 𝐁𝐄𝐋𝐓𝐀𝐇 𝐁𝐎𝐓"), 10 * 60 * 1000); // Update every 10 minutes

module.exports = async (client, m, chatUpdate, store) => {
    try {
        const { prefix, mode } = require("./set.js"); // Ensure set.js is in the same directory
        const BOT_NAME = "𝐁𝐋𝐀𝐂𝐊 𝐁𝐄𝐋𝐓𝐀𝐇 𝐁𝐎𝐓"; // Define bot name here for consistency

        let body = (typeof m.text === 'string' ? m.text : '');
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        const reply = (tek) => {
            client.sendMessage(m.chat, { text: tek }, { quoted: m });
        };

        // Function to simulate typing for a short duration
        const simulateTyping = async (durationMs = 1500) => {
            await client.sendPresenceUpdate('composing', m.chat);
            await new Promise(resolve => setTimeout(resolve, durationMs));
            await client.sendPresenceUpdate('available', m.chat); // Revert to online
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

        // --- Execute Bot Presence Update on relevant commands or bot start ---
        // You might want to call this once when the bot starts, not for every message.
        // For demonstration, calling it here will reset the timer on every message.
        // A better approach is to call updateBotPresence(client, m) once in your main bot's entry file.
        // For now, let's just make sure it's called on certain commands to demonstrate.
        if (isCmd && ['menu', 'status'].includes(command)) { // Only update presence on specific commands
             updateBotPresence(client, m);
        }

        switch (command) {
            case "menu":
                await client.sendMessage(m.chat, {
                    audio: fs.readFileSync('./Media/ponk.mp3'),
                    mimetype: "audio/mp4",
                    ptt: true
                }, { quoted: m });

                let cap = `
\`\`\`
╔═════════════════════════════╗
⋞ ${BOT_NAME} - 𝐀𝐑𝐈𝐀 𝐌𝐄𝐍𝐔 ⋟
◇ Stylish WhatsApp AI Chatbot ◇
♡ Powered by Ishaq Ibrahim ♡
╚════════════════════════════╝

╔═══════♧ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 ♧═══════╗
│ 👤 Name: ${m.pushName}
│ 🧠 Mode: ${mode}
│ ⏳ Uptime: ${runtime(process.uptime())}
│ 🤖 Bot: ${BOT_NAME}
╚════════════════════════════╝

╔═══════♤ 𝗠𝗘𝗗𝗜𝗔 ♤════════╗
│ 🎵 ${prefix}play2 <song name> - YouTube Music DL
│ 📃 ${prefix}lyrics2 <song title> - Song Lyrics
│ 🧷 ${prefix}vv - ViewOnce retriever (Quote view-once msg)
│ 🎭 ${prefix}sticker - Image to Sticker (Reply to image)
╚════════════════════════════╝

╔═══════◇ 𝗔𝗜 & 𝗚𝗔𝗠𝗘𝗦 ◇═════╗
│ 👨‍💻 ${prefix}chat <query> - AI Hinglish Chat
│ 📥 ${prefix}downloader <link> - TikTok/IG/FB Downloader
│ 🧠 ${prefix}trivia - Fun Questions
│ 🎯 ${prefix}guess - Guess Game
╚════════════════════════════╝

╔═══════♧ 𝗚𝗥𝗢𝗨𝗣 𝗖𝗧𝗥𝗟 ♧═══════╗
│ 👑 ${prefix}admin - Admin Control
│ 🏷 ${prefix}tagall - Mention All
│ 🛑 ${prefix}antilink - Block links
│ 👋 ${prefix}welcome - Enable Welcome
╚════════════════════════════╝

╔═══════♤ 𝗨𝗧𝗜𝗟𝗦 ♤══════════╗
│ 📖 ${prefix}bible - Bible Verse
│ 📘 ${prefix}quran - Quran Verse
│ 🔎 ${prefix}ytsearch - Youtube
│ 💬 ${prefix}say <text> - Text to Speech
│ 📈 ${prefix}status - Show bot's dynamic status
│ 💻 ${prefix}hack - Fun fake hacking animation
╚════════════════════════════╝

╔═══════◇ 𝗢𝗪𝗡𝗘𝗥 & 𝗦𝗬𝗦 ◇═══════╗
│ 🔒 ${prefix}lock - Admin Only Mode
│ 💾 ${prefix}save - Save Chat
│ 🗑️ ${prefix}clearall - Wipe Data
│ 🤖 ${prefix}setbio - Toggle/Set Bot Bio
╚════════════════════════════╝

💡 _Use commands like: ${prefix}play2 Alan Walker_
\`\`\`
`;

                await client.sendMessage(m.chat, {
                    image: fs.readFileSync('./Media/blackmachant.jpg'),
                    caption: cap,
                }, { quoted: m });
                break;

            case "chat":
                if (!text) return reply("Type something to chat with AI.");
                await simulateTyping(2000); // Simulate typing for 2 seconds
                let res = await axios.get(`https://api.akuari.my.id/ai/gbard?chat=${encodeURIComponent(text)}`);
                client.sendMessage(m.chat, { text: res.data.respon }, { quoted: m });
                break;

            case "play2": {
                if (!text) return reply("Provide song name.");
                await simulateTyping(3000); // Simulate typing for 3 seconds
                let { videos } = await yts(text);
                if (!videos.length) return reply("No video found.");
                const url = videos[0].url;
                const data = await fetchJson(`https://api.dreaded.site/api/ytdl/audio?url=${url}`);
                const { title, url: audioUrl } = data.result;
                await client.sendMessage(m.chat, {
                    document: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title}.mp3`,
                    caption: `🎵 *${title}*\nPowered by ${BOT_NAME}`,
                }, { quoted: m });
                break;
            }

            case "lyrics2": {
                if (!text) return reply("Type song title.");
                await simulateTyping(2000);
                const searches = await Genius.songs.search(text);
                if (!searches.length) return reply("No lyrics found.");
                const lyrics = await searches[0].lyrics();
                client.sendMessage(m.chat, { text: lyrics }, { quoted: m });
                break;
            }

            case "vv":
            case "retrieve": {
                if (!m.quoted) return reply("Quote a viewonce message.");
                await simulateTyping(1000);
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
                await simulateTyping(1000);
                reply("📖 John 3:16 — For God so loved the world, that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.");
                break;

            case "quran":
                await simulateTyping(1000);
                reply("📘 Surah Al-Fatiha (The Opening) — بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ (In the name of Allah, the Most Gracious, the Most Merciful.)");
                break;

            case "status": {
                const emojis = ["🕵‍♂️", "💀", "👀", "🙊", "😊", "💖", "🌍", "🌹", "♨️", "🔥", "🎭", "📎", "🥰", "👻", "😹", "✌️", "🤔", "🫂", "🙌", "🙈", "🐀"];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await simulateTyping(500);
                reply(`My current status is: ${randomEmoji} Online! Uptime: ${runtime(process.uptime())}`);
                // The actual "view status" for others is not directly feasible for bots.
                // This command reflects the bot's own 'status' dynamically.
                break;
            }

            case "setbio": {
                if (!text) return reply(`Please provide the text for the new bio, or type '${prefix}setbio reset' to reset.`);
                await simulateTyping(1000);
                if (text.toLowerCase() === 'reset') {
                    await updateBotBio(client, BOT_NAME); // Resets to default time + bot name
                    reply("Bot bio has been reset to dynamic time and bot name.");
                } else {
                    try {
                        await client.updateProfileStatus(text);
                        reply(`Bot bio updated to: "${text}"`);
                    } catch (e) {
                        console.error("Error setting custom bot bio:", e);
                        reply("Failed to set custom bot bio. An error occurred.");
                    }
                }
                break;
            }

            case "hack": {
                await client.sendPresenceUpdate('composing', m.chat); // Show typing
                const messages = [
                    "Initiating quantum decryption protocols...",
                    "Establishing secure connection to target server...",
                    "Bypassing firewall... [20%]",
                    "Injecting malicious payload... [45%]",
                    "Locating vulnerable entry points... [60%]",
                    "Extracting sensitive data... [75%]",
                    "Analyzing biometric authentication... [90%]",
                    "Access Granted. System Compromised.",
                    "HACK COMPLETE! Just kidding! This was a simulation for fun. 😂"
                ];

                for (let i = 0; i < messages.length; i++) {
                    await client.sendMessage(m.chat, { text: messages[i] }, { quoted: m });
                    await new Promise(resolve => setTimeout(resolve, i < messages.length - 1 ? 1500 : 3000)); // Longer pause at the end
                }
                await client.sendPresenceUpdate('available', m.chat); // Revert to online
                break;
            }

            // Add other commands here
            case "sticker": {
                if (!m.quoted || !(m.quoted.imageMessage || m.quoted.videoMessage)) {
                    return reply("Please reply to an image or video to make a sticker.");
                }
                await simulateTyping(1500);
                const media = await client.downloadAndSaveMediaMessage(m.quoted);
                await client.sendMessage(m.chat, { sticker: fs.readFileSync(media) }, { quoted: m });
                fs.unlinkSync(media); // Clean up temp file
                break;
            }

            // --- Placeholders for other menu commands (implement as needed) ---
            // case "downloader":
            //     reply("Downloader command coming soon!");
            //     break;
            // case "trivia":
            //     reply("Trivia game coming soon!");
            //     break;
            // case "guess":
            //     reply("Guess game coming soon!");
            //     break;
            // case "admin":
            //     reply("Admin control features coming soon!");
            //     break;
            // case "tagall":
            //     reply("Tag all members command coming soon!");
            //     break;
            // case "antilink":
            //     reply("Antilink feature coming soon!");
            //     break;
            // case "welcome":
            //     reply("Welcome feature coming soon!");
            //     break;
            // case "ytsearch":
            //     if (!text) return reply("What do you want to search on YouTube?");
            //     await simulateTyping(2000);
            //     let { videos: ytVideos } = await yts(text);
            //     if (!ytVideos.length) return reply("No results found on YouTube.");
            //     let ytResult = `*Youtube Results for '${text}':*\n\n`;
            //     ytVideos.slice(0, 5).forEach((v, i) => { // Show top 5 results
            //         ytResult += `${i + 1}. *${v.title}*\n`;
            //         ytResult += `   Duration: ${v.duration}\n`;
            //         ytResult += `   Views: ${v.views}\n`;
            //         ytResult += `   URL: ${v.url}\n\n`;
            //     });
            //     reply(ytResult);
            //     break;
            // case "say":
            //     if (!text) return reply("What should I say?");
            //     // Text-to-speech implementation usually involves an API or a library
            //     // For example, if using Google Text-to-Speech API
            //     // const ttsUrl = `https://api.example.com/tts?text=${encodeURIComponent(text)}`;
            //     // await client.sendMessage(m.chat, { audio: { url: ttsUrl }, mimetype: 'audio/mpeg' }, { quoted: m });
            //     reply(`I would say: "${text}" (TTS feature not fully implemented)`);
            //     break;
            // case "lock":
            //     reply("Lock command coming soon!");
            //     break;
            // case "save":
            //     reply("Save chat command coming soon!");
            //     break;
            // case "clearall":
            //     reply("Clear all data command coming soon!");
            //     break;


            default:
                // No action for unknown commands or non-command messages
                break;
        }

    } catch (err) {
        console.error("Error in blacks.js message handler:", err);
        reply("An internal error occurred. Please try again later.");
    }
};

// IMPORTANT: How to handle auto bio and presence updates:
// These functions (updateBotPresence, updateBotBio) should ideally be called from your
// main bot initialization file (e.g., index.js or app.js) after the client is ready.

// Example in your main bot file (e.g., index.js):
/*
const { WAConnection, MessageType } = require('@whiskeySockets/baileys'); // Or your Baileys equivalent
const pino = require('pino'); // Or your logger
const fs = require('fs');
const blacksHandler = require('./blacks.js'); // Assuming blacks.js is in the same directory

async function startBot() {
    const client = new WAConnection();
    client.logger = pino({ level: 'silent' }); // Or your logger setup

    client.on('qr', qr => {
        console.log('Scan QR:', qr);
        // Display QR code for scanning
    });

    client.on('credentials-updated', () => {
        fs.writeFileSync('./auth_info.json', JSON.stringify(client.base64EncodedAuthInfo(), null, '\t'));
    });

    await client.connect();

    // Call updateBotBio and updateBotPresence AFTER connection is established
    // Pass the client and m (or just chat ID) to updateBotPresence if you want it specific to a chat.
    // For global presence, you might need to adapt client.sendPresenceUpdate usage.
    // For auto bio:
    setInterval(() => updateBotBio(client, "𝐁𝐋𝐀𝐂𝐊 𝐁𝐄𝐋𝐓𝐀𝐇 𝐁𝐎𝐓"), 10 * 60 * 1000); // Update bio every 10 mins

    // For cycling presence (online, typing, recording):
    // You might want to define a chat ID for presence updates, or let it apply generally.
    // A more robust way would be to have a 'default' chat for presence updates, or
    // set presence whenever the bot processes a message.
    // For simplicity, let's assume it gets called within the message handler as designed above.
    // If you want it to run constantly in the background regardless of messages:
    // This requires a chat ID. You'd need to pick one where the bot is active.
    // If you want it to apply to the first chat it receives a message from:
    // let firstChatId = null;
    // client.on('messages.upsert', async (mek) => {
    //     if (!firstChatId && mek.messages.length > 0) {
    //         firstChatId = mek.messages[0].key.remoteJid;
    //         updateBotPresence(client, { chat: firstChatId }); // Start presence updates for this chat
    //     }
    //     await blacksHandler(client, mek.messages[0], mek, null); // Pass necessary args
    // });
}

startBot();
*/
