// blacks.js - The Final Comprehensive Bot Command Handler Script

// Node.js built-in and external library imports
const fs = require('fs');         // For file system operations (reading audio/images, deleting temp files)
const axios = require('axios');   // For making HTTP requests to external APIs (e.g., AI)
const yts = require('yt-search'); // For searching YouTube
const fetch = require('node-fetch'); // For making HTTP requests (used by fetchJson)
const Client = require('genius-lyrics'); // For fetching song lyrics
const Genius = new Client.Client(); // Initialize Genius Lyrics client

// --- Global State for Group Features (In-memory, clears on bot restart) ---
const antilinkStatus = new Map();  // Stores { chatId: boolean } - true if anti-link is enabled for that chat
const welcomeStatus = new Map();   // Stores { chatId: boolean } - true if welcome is enabled for that chat
const welcomeMessages = new Map(); // Stores { chatId: string } - Custom welcome message for that chat

// --- Helper Functions ---

/**
 * Checks if a string is a valid URL.
 * @param {string} str The string to check.
 * @returns {boolean} True if the string is a URL, false otherwise.
 */
function isValidUrl(str) {
    try {
        new URL(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Fetches JSON data from a given URL with a configurable timeout.
 * Provides more robust error handling for network requests.
 * @param {string} url - The URL to fetch data from.
 * @param {Object} [options={}] - Fetch options, including `timeout` in milliseconds.
 * @returns {Promise<Object>} - A promise that resolves to the parsed JSON data.
 * @throws {Error} If the network request fails, times out, or the response is not OK.
 */
const fetchJson = async (url, options = {}) => {
    try {
        const controller = new AbortController();
        // Set a default timeout or use the one provided in options
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 20000); // Default 20 seconds timeout
        
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId); // Clear timeout if fetch completes before timeout

        if (!res.ok) {
            let errorText = `HTTP error! Status: ${res.status}`;
            try {
                // Attempt to read response body for more error context
                const errorBody = await res.text();
                errorText += ` - Response: ${errorBody.substring(0, 200)}...`; // Limit displayed body length
            } catch (e) {
                // Ignore if response body cannot be read
            }
            throw new Error(errorText);
        }
        return await res.json();
    } catch (error) {
        console.error('fetchJson error:', error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out.'); // Specific message for timeouts
        }
        throw error; // Re-throw other errors
    }
};

let presenceInterval;
let presenceIndex = 0;
// Define bot presence states for cycling
const presences = ['available', 'composing', 'recording']; // 'available' (online), 'composing' (typing), 'recording' (recording audio)

/**
 * Cycles the bot's WhatsApp presence (e.g., online, typing, recording).
 * This function should ideally be called once on bot start or triggered periodically.
 * @param {object} client - The Baileys client instance.
 * @param {object} m - The message object (used to get `m.chat` for the chat ID).
 */
async function updateBotPresence(client, m) {
    // Ensure there's a valid chat ID to send presence updates to
    if (!m || !m.chat) {
        console.warn("Cannot update presence: 'm' or 'm.chat' is undefined. Presence update skipped.");
        return;
    }
    // Clear any existing interval to prevent multiple simultaneous updates
    if (presenceInterval) clearInterval(presenceInterval); 

    presenceInterval = setInterval(async () => {
        const currentPresence = presences[presenceIndex];
        try {
            // Send the presence update to the specified chat
            await client.sendPresenceUpdate(currentPresence, m.chat);
            // console.log(`[Presence] Setting to: ${currentPresence} in chat: ${m.chat}`); // For debugging
        } catch (e) {
            console.error("Failed to send presence update:", e);
            clearInterval(presenceInterval); // Stop trying if it consistently fails
        }
        // Move to the next presence state in the cycle
        presenceIndex = (presenceIndex + 1) % presences.length; 
    }, 5 * 60 * 1000); // Cycle every 5 minutes (5 minutes * 60 seconds * 1000 milliseconds)
}

/**
 * Updates the bot's WhatsApp profile status (bio) with the current time.
 * This should typically be called periodically (e.g., every 10-15 minutes) from your main bot file.
 * @param {object} client - The Baileys client instance.
 * @param {string} botName - The name of the bot to include in the bio.
 */
async function updateBotBio(client, botName) {
    try {
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const newBio = `${BOT_NAME} says hi at ${currentTime}`; // Use global BOT_NAME
        await client.updateProfileStatus(newBio); // Baileys function to update profile status
        console.log(`[Bot Bio] Updated to: ${newBio}`);
    } catch (e) {
        console.error("[Bot Bio] Failed to update bot bio:", e);
    }
}

/**
 * Simulates typing in the chat for a given duration.
 * @param {object} client - The Baileys client instance.
 * @param {string} chatId - The ID of the chat where typing should be simulated.
 * @param {number} [durationMs=1500] - The duration in milliseconds to simulate typing.
 */
const simulateTyping = async (client, chatId, durationMs = 1500) => {
    await client.sendPresenceUpdate('composing', chatId); // Set presence to 'typing'
    await new Promise(resolve => setTimeout(resolve, durationMs)); // Wait for the duration
    await client.sendPresenceUpdate('available', chatId); // Revert presence to 'online'
};

/**
 * Converts a duration in seconds into a human-readable format (days, hours, minutes, seconds).
 * @param {number} seconds - The duration in seconds.
 * @returns {string} The formatted duration string.
 */
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

// --- Main Message Handler (This is your core 'blacks.js') ---

/**
 * This function handles all incoming messages and executes commands.
 * It's designed to be called from your main bot entry file (e.g., index.js)
 * when a new message is received.
 * @param {object} client - The Baileys client instance.
 * @param {object} m - The message object.
 * @param {object} chatUpdate - The full chat update object from Baileys.
 * @param {object} store - The Baileys store object (for message history, contacts, etc.).
 */
module.exports = async (client, m, chatUpdate, store) => {
    try {
        // Dynamically import bot settings (prefix, mode)
        const { prefix, mode } = require("./set.js"); // Ensure set.js is in the same directory

        // Define bot's display name for consistency
        const BOT_NAME = "𝐁𝐋𝐀𝐂𝐊 𝐁𝐄𝐋𝐓𝐀𝐇 𝐁𝐎𝐓"; 

        // Extract message body, check if it's a command, and parse command/arguments
        let body = (typeof m.text === 'string' ? m.text : '');
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        const isGroup = m.key.remoteJid.endsWith('@g.us'); // Check if message is from a group
        // Get sender's JID in a consistent format
        const sender = m.key.participant || m.key.remoteJid; 
        
        // Helper function to get group metadata (if in a group)
        const getGroupMetadata = async (chatId) => {
            if (!isGroup) return null;
            try {
                return await client.groupMetadata(chatId);
            } catch (e) {
                console.error(`Failed to get group metadata for ${chatId}:`, e);
                return null;
            }
        };

        // Helper function to check if sender is admin
        const isSenderAdmin = async () => {
            if (!isGroup) return false;
            const metadata = await getGroupMetadata(m.chat);
            if (!metadata) return false;
            return metadata.participants.some(p => p.id === sender && p.admin);
        };

        // Helper function to check if bot is admin
        const isBotAdmin = async () => {
            if (!isGroup) return false;
            const metadata = await getGroupMetadata(m.chat);
            if (!metadata) return false;
            const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
            return metadata.participants.some(p => p.id === botId && p.admin);
        };

        /**
         * Helper function to reply to the current message.
         * @param {string} text - The text to send as a reply.
         * @param {object} [quotedMsg=m] - The message to quote (defaults to the incoming message).
         */
        const reply = (tek, quotedMsg = m) => {
            client.sendMessage(m.chat, { text: tek }, { quoted: quotedMsg });
        };


        // --- ANTI-LINK LOGIC (RUNS FOR EVERY MESSAGE IN A GROUP) ---
        // This must be placed before command processing to delete links quickly.
        if (isGroup && antilinkStatus.get(m.chat)) {
            const botIsAdmin = await isBotAdmin();
            const senderIsAdmin = await isSenderAdmin();

            if (botIsAdmin && !senderIsAdmin) { // Only delete if bot is admin and sender is NOT admin
                const messageText = body.toLowerCase();
                const containsLink = messageText.includes('http://') || messageText.includes('https://') || messageText.includes('www.');
                
                // Allow WhatsApp group invite links (e.g., from other groups)
                const isWaInvite = messageText.includes('chat.whatsapp.com');

                if (containsLink && !isWaInvite) {
                    try {
                        await client.sendMessage(m.chat, { delete: m.key }); // Delete the message
                        reply(`🚫 Link detected! Only admins are allowed to send external links here. Message deleted.`);
                        // Optional: Kick the user (uncomment if you want this functionality)
                        // await client.groupParticipantsUpdate(m.chat, [sender], 'remove');
                        return; // Stop further processing of this message
                    } catch (e) {
                        console.error("Failed to delete link message:", e);
                        reply("🚫 I detected a link, but couldn't delete it. Make sure I'm a group admin!");
                    }
                }
            } else if (antilinkStatus.get(m.chat) && !botIsAdmin) {
                // If antilink is active but bot is not admin, warn admins
                // This warning should probably be sent once, not for every message.
                // For simplicity, we'll let it pass for now if bot isn't admin and antilink is on.
                // You might want a persistent flag to warn only once until bot becomes admin.
            }
        }
        // --- END ANTI-LINK LOGIC ---


        // --- Execute Bot Presence Update on relevant commands ---
        if (isCmd && ['menu', 'status'].includes(command)) {
             updateBotPresence(client, m);
        }

        // --- Command Switch Case ---
        switch (command) {
            case "menu":
                // Play a pre-defined audio file
                await client.sendMessage(m.chat, {
                    audio: fs.readFileSync('./Media/ponk.mp3'),
                    mimetype: "audio/mp4",
                    ptt: true // Play as Push To Talk (voice message)
                }, { quoted: m });

                // Construct the highly formatted menu caption
                let cap = `
\`\`\`
╔═════════════════════════════╗
⋞ *${BOT_NAME} - 𝐀𝐑𝐈𝐀 𝐌𝐄𝐍𝐔* ⋟
◇ Stylish WhatsApp AI Chatbot ◇
♡ Powered by Ishaq Ibrahim ♡
╚════════════════════════════╝

╔═══════*♧ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 ♧*═══════╗
│ 👤 Name: ${m.pushName}
│ 🧠 Mode: ${mode}
│ ⏳ Uptime: ${runtime(process.uptime())}
│ 🤖 Bot: ${BOT_NAME}
╚════════════════════════════╝

╔═══════*•○◎ 𝗠𝗘𝗗𝗜𝗔 ◎○•*════════╗
│ 🎵 ${prefix}play <song name/URL> - Music Downloader
│ 📃 ${prefix}lyrics2 <song title> - Song Lyrics
│ 🧷 ${prefix}vv - ViewOnce retriever (Quote view-once msg)
│ 🎭 ${prefix}sticker - Image to Sticker (Reply to image)
╚════════════════════════════╝

╔═══════*•○◎ 𝗔𝗜 & 𝗚𝗔𝗠𝗘𝗦 ◎○•*═════╗
│ 👨‍💻 ${prefix}chat <query> - AI Hinglish Chat
│ 📥 ${prefix}downloader <link> - TikTok/IG/FB Downloader
│ 🧠 ${prefix}trivia - Fun Questions
│ 🎯 ${prefix}guess - Guess Game
╚════════════════════════════╝

╔═══════*•○◎ 𝗚𝗥𝗢𝗨𝗣 𝗖𝗧𝗥𝗟 ◎○•*═══════╗
│ 👑 ${prefix}admin - Admin Control Menu
│ 🏷 ${prefix}tagall - Mention All Group Members
│ 🛑 ${prefix}antilink <on/off> - Toggle Anti-Link
│ 👋 ${prefix}welcome <on/off/set> - Toggle Welcome & Set Message
╚════════════════════════════╝

╔═══════*•○◎ 𝗨𝗧𝗜𝗟𝗦 ◎○•*══════════╗
│ 📖 ${prefix}bible - Bible Verse
│ 📘 ${prefix}quran - Quran Verse
│ 🔎 ${prefix}ytsearch - Youtube
│ 💬 ${prefix}say <text> - Text to Speech
│ 📈 ${prefix}status - Show bot's dynamic status
│ 💻 ${prefix}hack - Fun fake hacking animation
╚════════════════════════════╝

╔═══════*•○◎ 𝗢𝗪𝗡𝗘𝗥 & 𝗦𝗬𝗦 ◎○•*═══════╗
│ 🔒 ${prefix}lock - Admin Only Mode
│ 💾 ${prefix}save - Save Chat
│ 🗑️ ${prefix}clearall - Wipe Data
│ 🤖 ${prefix}setbio - Toggle/Set Bot Bio
╚════════════════════════════╝

💡 _Use commands like: ${prefix}play [Your Song Name] or ${prefix}play [Music Link]_
\`\`\`
`;
                // Send the image with the generated menu caption
                await client.sendMessage(m.chat, {
                    image: fs.readFileSync('./Media/blackmachant.jpg'),
                    caption: cap,
                }, { quoted: m });
                break;

            case "chat":
                if (!text) return reply("Please provide something to chat with the AI about. Example: `.chat What is the capital of Kenya?`");
                await simulateTyping(client, m.chat, 2000); // Simulate typing for 2 seconds
                try {
                    // Fetch AI response from the external API
                    let res = await fetchJson(`https://api.akuari.my.id/ai/gbard?chat=${encodeURIComponent(text)}`, { timeout: 15000 }); // 15-second timeout
                    if (res && res.respon) {
                        client.sendMessage(m.chat, { text: res.respon }, { quoted: m });
                    } else {
                        // Handle cases where API returns empty or unexpected response
                        reply("🚫 Sorry, I received an empty or invalid response from the AI. Please try again with a different query.");
                        console.error("AI API returned unexpected response:", res);
                    }
                } catch (error) {
                    console.error(`Error in chat command for "${text}":`, error);
                    // Provide user-friendly error message
                    reply("🚫 Sorry, I'm having trouble connecting to my brain right now. The AI service might be unavailable or timed out. Please try again later!");
                }
                break;

            case "play": { // Renamed from play2 to play for broader use
                if (!text) return reply("Please provide a song name or a direct link (e.g., YouTube, Spotify, SoundCloud) to search and download. Example: `.play Billie Eilish Bad Guy` or `.play <link>`");
                await simulateTyping(client, m.chat, 3000); // Simulate typing for 3 seconds
                
                let targetUrl = '';
                let title = 'Music Download'; // Default title, will try to get a better one
                
                try {
                    if (isValidUrl(text)) {
                        targetUrl = text;
                        // For direct links, we can't easily get the title without another API call or a specific library
                        // The download API might return it, so we'll rely on that.
                        reply(`🎶 Attempting to download from provided link... This might take a moment.`);
                    } else {
                        // If it's not a URL, assume it's a Youtube query
                        let { videos } = await yts(text);
                        if (!videos.length) return reply("❌ No video found for your query on YouTube. Please try a different song name or artist.");
                        
                        targetUrl = videos[0].url;
                        title = videos[0].title;
                        reply(`🎶 Found: *${title}* by *${videos[0].author.name}*\nStarting download... This might take a moment.`);
                    }

                    // --- IMPORTANT: This API endpoint is for YouTube. For other platforms,
                    // you might need a different API that specifically supports them,
                    // or to run a local program like yt-dlp. ---
                    // Assuming api.dreaded.site can handle various URLs for audio.
                    const data = await fetchJson(`https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(targetUrl)}`, { timeout: 30000 }); // 30-second timeout for download
                    
                    if (data && data.result && data.result.url) {
                        // Use the title from the API response if available, otherwise fallback
                        const finalTitle = data.result.title || title;
                        const audioUrl = data.result.url;
                        
                        await client.sendMessage(m.chat, {
                            document: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${finalTitle}.mp3`,
                            caption: `🎵 *${finalTitle}*\n_Powered by ${BOT_NAME}_`,
                        }, { quoted: m });
                    } else {
                        reply("🚫 Failed to get a valid download link from the music service. The song/link might not be downloadable, the service returned an invalid response, or the platform is not supported.");
                        console.error("Music API returned unexpected data structure for download:", data);
                    }
                } catch (error) {
                    console.error(`Error in play command for "${text}":`, error);
                    reply(`🚫 Sorry, I couldn't download that music right now. This might be because the link is unsupported, the service is busy, unresponsive, or the song isn't available. Please try a different song/link or try again later. Error: ${error.message.substring(0, 100)}`);
                }
                break;
            }

            case "lyrics2": {
                if (!text) return reply("Please provide a song title to search for lyrics. Example: `.lyrics2 Queen Bohemian Rhapsody`");
                await simulateTyping(client, m.chat, 2000);
                try {
                    // Search Genius for lyrics
                    const searches = await Genius.songs.search(text);
                    if (!searches.length) return reply("❌ No lyrics found for that song. Please try a different title or artist name.");
                    
                    const lyrics = await searches[0].lyrics();
                    // Send the retrieved lyrics
                    client.sendMessage(m.chat, { text: `📜 Lyrics for *${searches[0].title}* by *${searches[0].artist.name}*:\n\n${lyrics}` }, { quoted: m });
                } catch (error) {
                    console.error(`Error in lyrics2 command for "${text}":`, error);
                    // Provide user-friendly error message for lyrics retrieval failures
                    reply(`🚫 Couldn't fetch lyrics right now. The lyrics service might be unavailable or timed out. Please try again later. Error: ${error.message.substring(0, 100)}`);
                }
                break;
            }

            case "vv": // ViewOnce retrieval
            case "retrieve": {
                if (!m.quoted) return reply("Please *quote* a view-once message (image or video) to retrieve its content.");
                await simulateTyping(client, m.chat, 1000);
                const quoted = m.msg?.contextInfo?.quotedMessage;

                // Check if the quoted message is an image or video
                if (quoted?.imageMessage) {
                    try {
                        const img = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
                        // Send the retrieved image as a *regular* image (not view-once)
                        client.sendMessage(m.chat, { image: { url: img }, caption: "📸 Retrieved View-Once Image" }, { quoted: m });
                        fs.unlinkSync(img); // Clean up the temporary downloaded file
                    } catch (e) {
                        console.error("Error retrieving view-once image:", e);
                        reply("🚫 Failed to retrieve view-once image. It might have expired or an error occurred.");
                    }
                } else if (quoted?.videoMessage) {
                    try {
                        const vid = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
                        // Send the retrieved video as a *regular* video (not view-once)
                        client.sendMessage(m.chat, { video: { url: vid }, caption: "🎥 Retrieved View-Once Video" }, { quoted: m });
                        fs.unlinkSync(vid); // Clean up the temporary downloaded file
                    } catch (e) {
                        console.error("Error retrieving view-once video:", e);
                        reply("🚫 Failed to retrieve view-once video. It might have expired or an error occurred.");
                    }
                } else {
                    reply("The quoted message is not a view-once image or video that I can retrieve.");
                }
                break;
            }

            case "bible":
                await simulateTyping(client, m.chat, 1000);
                reply("📖 John 3:16 — For God so loved the world, that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.");
                break;

            case "quran":
                await simulateTyping(client, m.chat, 1000);
                reply("📘 Surah Al-Fatiha (The Opening) — بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ (In the name of Allah, the Most Gracious, the Most Merciful.)");
                break;

            case "status": {
                // Randomly select an emoji for dynamic status
                const emojis = ["🕵‍♂️", "💀", "👀", "🙊", "😊", "💖", "🌍", "🌹", "♨️", "🔥", "🎭", "📎", "🥰", "👻", "😹", "✌️", "🤔", "🫂", "🙌", "🙈", "🐀"];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await simulateTyping(client, m.chat, 500);
                // Display bot's current status and uptime
                reply(`My current status is: ${randomEmoji} *Online!* Uptime: ${runtime(process.uptime())}`);
                break;
            }

            case "setbio": {
                if (!text) return reply(`Please provide the text for the new bio, or type '${prefix}setbio reset' to reset to the default dynamic bio.`);
                await simulateTyping(client, m.chat, 1000);
                if (text.toLowerCase() === 'reset') {
                    await updateBotBio(client, BOT_NAME); // Resets bio to default time + bot name
                    reply("Bot bio has been reset to the dynamic time and bot name.");
                } else {
                    try {
                        // Attempt to set a custom bio
                        await client.updateProfileStatus(text);
                        reply(`Bot bio updated to: "${text}"`);
                    } catch (e) {
                        console.error("Error setting custom bot bio:", e);
                        reply("Failed to set custom bot bio. This might be due to WhatsApp API limits or an invalid text.");
                    }
                }
                break;
            }

            case "hack": {
                await client.sendPresenceUpdate('composing', m.chat); // Show typing animation
                const messages = [
                    "Initiating quantum decryption protocols...",
                    "Establishing secure connection to target server...",
                    "Bypassing firewall... [20%]",
                    "Injecting malicious payload... [45%]",
                    "Locating vulnerable entry points... [60%]",
                    "Extracting sensitive data... [75%]",
                    "Analyzing biometric authentication... [90%]",
                    "*Access Granted. System Compromised.*", // Bold last message
                    "HACK COMPLETE! Just kidding! This was a simulation for fun. 😂"
                ];

                // Send messages sequentially with pauses to simulate hacking
                for (let i = 0; i < messages.length; i++) {
                    await client.sendMessage(m.chat, { text: messages[i] }, { quoted: m });
                    // Longer pause after the final "HACK COMPLETE" message
                    await new Promise(resolve => setTimeout(resolve, i < messages.length - 1 ? 1500 : 3000)); 
                }
                await client.sendPresenceUpdate('available', m.chat); // Revert to online
                break;
            }

            case "sticker": {
                // Ensure a quoted image or video message exists
                if (!m.quoted || !(m.quoted.imageMessage || m.quoted.videoMessage)) {
                    return reply("Please reply to an image or video to convert it into a sticker.");
                }
                await simulateTyping(client, m.chat, 1500);
                try {
                    // Download the quoted media
                    const media = await client.downloadAndSaveMediaMessage(m.quoted);
                    // Send the downloaded media as a sticker
                    await client.sendMessage(m.chat, { sticker: fs.readFileSync(media) }, { quoted: m });
                    fs.unlinkSync(media); // Clean up the temporary file
                } catch (e) {
                    console.error("Error creating sticker:", e);
                    reply("Failed to create sticker. Make sure the media is valid (e.g., supported format, not too large) or try again.");
                }
                break;
            }

            case "ytsearch":
                if (!text) return reply("What do you want to search on YouTube? Example: `.ytsearch Python tutorial for beginners`");
                await simulateTyping(client, m.chat, 2000);
                try {
                    // Perform Youtube
                    let { videos: ytVideos } = await yts(text);
                    if (!ytVideos.length) return reply("❌ No results found on YouTube for your search query. Try rephrasing or using different keywords.");
                    
                    let ytResult = `*Youtube Results for '${text}':*\n\n`;
                    // Format and display top 5 results
                    ytVideos.slice(0, 5).forEach((v, i) => { 
                        ytResult += `${i + 1}. *${v.title}*\n`;
                        ytResult += `   Duration: ${v.duration}\n`;
                        ytResult += `   Views: ${v.views}\n`;
                        ytResult += `   URL: ${v.url}\n\n`;
                    });
                    reply(ytResult);
                } catch (error) {
                    console.error(`Error in ytsearch command for "${text}":`, error);
                    reply(`🚫 Failed to search YouTube. The service might be temporarily unavailable or there was a network issue. Error: ${error.message.substring(0, 100)}`);
                }
                break;

            case "say":
                if (!text) return reply("What should I say? Example: `.say Hello, how are you?`");
                // Text-to-speech implementation requires integration with an external TTS API or library.
                reply(`I would say: "${text}" (Note: Text-to-Speech feature not fully implemented in this version, requires an external API or library.)`);
                break;

            // --- Group Commands ---

            case "admin":
                if (!isGroup) return reply("This command can only be used in a group!");
                const botIsAdm = await isBotAdmin();
                const senderIsAdm = await isSenderAdmin();

                if (!senderIsAdm) return reply("👑 You must be a group admin to use admin commands.");
                
                let adminMenu = `
👑 *Admin Control Menu* 👑
_Only group admins can use these commands._

`;
                if (!botIsAdm) {
                    adminMenu += `⚠️ *Warning:* I am not a group admin! I need admin privileges to perform most group actions (e.g., tagall, antilink, welcome, kick, promote, demote).\n\n`;
                }

                adminMenu += `
*Possible Admin Actions (Planned):*
• ${prefix}promote @user - Promote user to admin
• ${prefix}demote @user - Demote user from admin
• ${prefix}kick @user - Remove user from group
• ${prefix}add <number> - Add user to group
• ${prefix}setdesc <text> - Set group description
• ${prefix}setsubject <text> - Set group name
• ${prefix}grouplink - Get group invite link
• ${prefix}revoke - Revoke group invite link

_More admin commands coming soon!_
`;
                reply(adminMenu);
                break;

            case "tagall":
                if (!isGroup) return reply("This command can only be used in a group!");
                const groupMetadata = await getGroupMetadata(m.chat);
                if (!groupMetadata) return reply("Couldn't retrieve group information. Try again later.");

                const senderIsAdminTagall = await isSenderAdmin();
                const botIsAdminTagall = await isBotAdmin();

                if (!senderIsAdminTagall) return reply("🏷 You must be a group admin to use the tagall command.");
                if (!botIsAdminTagall) return reply("⚠️ I need to be a group admin to tag all members.");

                await simulateTyping(client, m.chat, 2000);
                let participants = groupMetadata.participants;
                let mentions = [];
                let message = "📣 *Attention all members:*\n";
                if (text) message += `_Message from Admin:_ ${text}\n\n`;

                for (let participant of participants) {
                    mentions.push({
                        tag: participant.id.split('@')[0],
                        id: participant.id,
                        name: participant.id.split('@')[0] // Fallback name
                    });
                    message += `@${participant.id.split('@')[0]}\n`;
                }
                
                await client.sendMessage(m.chat, {
                    text: message,
                    mentions: mentions.map(m => m.id) // Array of JIDs to mention
                }, { quoted: m });
                break;

            case "antilink":
                if (!isGroup) return reply("This command can only be used in a group!");
                const botIsAdminAntilink = await isBotAdmin();
                const senderIsAdminAntilink = await isSenderAdmin();

                if (!senderIsAdminAntilink) return reply("🛑 You must be a group admin to toggle anti-link.");
                if (!botIsAdminAntilink) return reply("⚠️ I need to be a group admin to enforce anti-link rules (delete messages).");

                if (!text) return reply(`Usage: ${prefix}antilink <on/off>\n\nCurrent status: ${antilinkStatus.get(m.chat) ? '*ON*' : '*OFF*'}`);

                if (text.toLowerCase() === 'on') {
                    antilinkStatus.set(m.chat, true);
                    reply("✅ Anti-Link feature has been *enabled* for this group. I will now try to delete external links sent by non-admins.");
                } else if (text.toLowerCase() === 'off') {
                    antilinkStatus.set(m.chat, false);
                    reply("❌ Anti-Link feature has been *disabled* for this group. Anyone can now send links.");
                } else {
                    reply(`Invalid option. Usage: ${prefix}antilink <on/off>`);
                }
                break;

            case "welcome":
                if (!isGroup) return reply("This command can only be used in a group!");
                const senderIsAdminWelcome = await isSenderAdmin();
                // Bot doesn't strictly need to be admin to *toggle* welcome, but it needs to be to *send* it when users join.
                // We'll add a check in the event listener in index.js for bot admin status.

                if (!senderIsAdminWelcome) return reply("👋 You must be a group admin to manage the welcome feature.");

                const welcomeOption = args[0] ? args[0].toLowerCase() : '';
                const customWelcomeMessage = args.slice(1).join(" ");

                if (welcomeOption === 'on') {
                    welcomeStatus.set(m.chat, true);
                    reply("✅ Welcome message feature has been *enabled* for this group.");
                } else if (welcomeOption === 'off') {
                    welcomeStatus.set(m.chat, false);
                    reply("❌ Welcome message feature has been *disabled* for this group.");
                } else if (welcomeOption === 'set') {
                    if (!customWelcomeMessage) return reply(`Please provide the welcome message. Usage: ${prefix}welcome set <Your custom message here. Use @user for mention>`);
                    welcomeMessages.set(m.chat, customWelcomeMessage);
                    reply(`📝 Custom welcome message set for this group: \n"${customWelcomeMessage}"\n\n(Use @user in your message to mention the new member)`);
                } else if (welcomeOption === 'get') {
                    const currentStatus = welcomeStatus.get(m.chat) ? 'ON' : 'OFF';
                    const currentMessage = welcomeMessages.get(m.chat) || 'No custom message set. Default will be used (if implemented in main script).';
                    reply(`👋 Welcome feature status: *${currentStatus}*\nCustom message: "${currentMessage}"`);
                }
                else {
                    reply(`Usage:\n${prefix}welcome <on/off> - Toggle welcome messages.\n${prefix}welcome set <message> - Set a custom welcome message (use @user to mention).\n${prefix}welcome get - View current settings.\n\nCurrent status: ${welcomeStatus.get(m.chat) ? '*ON*' : '*OFF*'}`);
                }
                break;

            // --- Other Commands (unchanged from previous version) ---

            case "downloader":
                reply("📥 TikTok/Instagram/Facebook Downloader coming soon! This feature will allow you to download media directly from popular social platforms.");
                break;
            case "trivia":
                reply("🧠 Trivia game coming soon! Get ready to test your knowledge with fun questions.");
                break;
            case "guess":
                reply("🎯 Guess game coming soon! Try to guess the word or number for a challenge.");
                break;
            case "lock":
                reply("🔒 Admin Only Mode coming soon! This will restrict bot usage to group admins/owners only.");
                break;
            case "save":
                reply("💾 Save chat command coming soon! This feature will allow you to save important chat messages.");
                break;
            case "clearall":
                reply("🗑️ Clear all data command coming soon! Use with extreme caution, as this will wipe bot-related data.");
                break;

            default:
                // No action for unknown commands or non-command messages - bot remains silent
                break;
        }

    } catch (err) {
        // This global catch block handles any unexpected errors that were not caught by
        // specific try-catch blocks within individual command handlers.
        console.error("🚫 Global error in blacks.js message handler:", err);
        reply(`🚫 An unexpected error occurred while processing your request: ${err.message.substring(0, 150)}. Please try again later or contact the bot owner.`);
    }
};

/*
// --- IMPORTANT NOTE FOR "WELCOME MESSAGE SENDING" & "ANTI-DELETE" ---

// 1. WELCOME MESSAGE SENDING:
// The actual sending of a welcome message when a new member *joins* a group
// (after the `welcome` command has *enabled* the feature)
// must be handled in your *main bot initialization file* (e.g., 'index.js' or 'app.js').
// This requires listening to the Baileys event 'group-participants.update'.

// To allow your main file to access the state of `welcomeStatus` and `welcomeMessages`,
// you need to *export* them from `blacks.js`. Add these lines at the very end of `blacks.js`:

module.exports.welcomeStatus = welcomeStatus;
module.exports.welcomeMessages = welcomeMessages;

// Then, in your `index.js` (or main bot file), you would modify your event listener for `group-participants.update` like this:

// --- SNIPPET FOR YOUR `index.js` (OR MAIN BOT FILE) ---
// Make sure you import the state from blacks.js:
// const blacksHandler = require('./blacks.js'); // Assuming this is how you load it
// const { welcomeStatus, welcomeMessages } = blacksHandler; // Access the exported maps

// And add this to your Baileys event listener setup (e.g., inside client.ev.on(...)):

client.ev.on('group-participants.update', async (data) => {
    const { id, participants, action } = data; // id is the group JID
    
    // Check if the welcome feature is enabled for this group
    if (welcomeStatus.get(id)) { 
        if (action === 'add') {
            // Re-check bot admin status for this specific action
            const groupMetadata = await client.groupMetadata(id);
            const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
            const botIsAdminHere = groupMetadata.participants.some(p => p.id === botId && p.admin);

            if (!botIsAdminHere) {
                console.warn(`Welcome enabled for ${id}, but bot is not admin. Cannot send welcome message for new participants.`);
                // You might send a message to group admins here, but avoid spamming.
                return;
            }

            for (const participantId of participants) { // Loop through added participants (can be multiple)
                // Get custom message or use a default one
                const welcomeMsg = welcomeMessages.get(id) || "Welcome to the group, @user! We're glad to have you here."; 
                
                // Replace @user placeholder with the actual mention
                let formattedMsg = welcomeMsg.replace(/@user/g, `@${participantId.split('@')[0]}`);
                
                await client.sendMessage(id, {
                    text: formattedMsg,
                    mentions: [participantId] // Ensure the user is actually mentioned
                });
            }
        }
        // You could add an 'action === "remove"' block here for a goodbye message if desired.
    }
});


// 2. ANTI-DELETE FEATURE:
// As discussed, the "anti-delete" feature (retrieving messages deleted for everyone)
// also needs to be handled in your *main bot initialization file* ('index.js' or 'app.js')
// by listening to 'messages.update' events and maintaining a message cache.
// The snippet for this was provided in our previous discussion.
*/
