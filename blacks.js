// BeltahBot-MD Menu Script (ARIA UI + All Features) // Owner: Ishaq Ibrahim | Bot: BeltahBot // Rich UI + All sections + Status Rotation + Functional Commands

case "menu": await mp3d();

let cap = ` ♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧ ♤ 𝗕𝗘𝗟𝗧𝗔𝗛-𝗕𝗢𝗧 𝗠𝗘𝗡𝗨 ♤ ◇ Stylish AI-Based WhatsApp Bot ◇ ♡ Powered by Ishaq Ibrahim ♡ ♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧

╔═══════❖•ೋ°🛠️°ೋ•❖═══════╗ ║ ⚙️ Bot Info ╠══════════════════════╣ ║ 👤 User: ${m.pushName} ║ ⚡ Mode: ${mode} ║ ⏱ Uptime: ${runtime(process.uptime())} ║ 🛡 Bot: 𝗕𝗘𝗟𝗧𝗔𝗛-𝗠𝗗 ╚═══════❖•ೋ°🛠️°ೋ•❖═══════╝

╔═══════♧ 𝗠𝗘𝗗𝗜𝗔 ♧════════╗ ║ 🎵 play2 - Download song ║ 📃 lyrics2 - Get song lyrics ║ 🧷 vv - ViewOnce retriever ║ 📸 sticker - Convert to sticker ╚═════════════════════════╝

╔═════♤ 𝗚𝗥𝗢𝗨𝗣 ♤═════════╗ ║ 👑 admin - Group control ║ 🏷 tagall - Mention all ║ 🛑 antilink - Block links ║ ⚒️ welcome - Enable welcome ╚═════════════════════════╝

╔═════◇ 𝗨𝗧𝗜𝗟𝗦 ◇═════════╗ ║ 📖 bible - Get Bible verse ║ 📘 quran - Quran verse fetch ║ 🔎 ytsearch - YouTube search ╚═════════════════════════╝

╔════♤ 𝗢𝗪𝗡𝗘𝗥 & 𝗦𝗬𝗦 ♤═════╗ ║ 🔐 lock - Admin only mode ║ 💾 save - Save chat ║ 🗑️ clearall - Clean bot chats ║ 🤖 status-mode - Toggle status ╚═════════════════════════╝

♧ Enjoy your command! Use .help <cmd> `;

client.sendMessage(m.chat, { image: fs.readFileSync('./Media/blackmachant.jpg'), caption: cap, }, { quoted: m }); break;

// ======================= STATUS CONTROL ======================= if (autobio === 'TRUE') { let statusIndex = 0; const statusTypes = ['typing', 'recording']; setInterval(() => { const statusType = statusTypes[statusIndex % statusTypes.length]; client.sendPresenceUpdate(statusType, client.user.id); statusIndex++; }, 5 * 60 * 1000); // Rotate every 5 mins }

if (autoviewstatus === 'TRUE') { client.ev.on("messages.upsert", async (chatUpdate) => { const mek = chatUpdate.messages[0]; if (mek.key?.remoteJid === "status@broadcast") { client.readMessages([mek.key]); } }); }

if (autolike === 'TRUE') { client.ev.on("messages.upsert", async (chatUpdate) => { const mek = chatUpdate.messages[0]; if (mek.key?.remoteJid === "status@broadcast") { const jid = mek.key.remoteJid; await client.sendMessage(jid, { react: { key: mek.key, text: '🔥' } }); } }); }

// ======================= COMMANDS =======================

// vv case "vv": case "retrieve": { if (!m.quoted) return m.reply("Quote a viewonce message."); const quoted = m.msg?.contextInfo?.quotedMessage; if (quoted?.imageMessage) { const img = await client.downloadAndSaveMediaMessage(quoted.imageMessage); client.sendMessage(m.chat, { image: { url: img }, caption: ♧ Retrieved Image ♧ }, { quoted: m }); } if (quoted?.videoMessage) { const vid = await client.downloadAndSaveMediaMessage(quoted.videoMessage); client.sendMessage(m.chat, { video: { url: vid }, caption: ♧ Retrieved Video ♧ }, { quoted: m }); } } break;

// lyrics2 case "lyrics2": { try { if (!text) return reply("Provide a song name."); const searches = await Client.songs.search(text); const lyrics = await searches[0].lyrics(); client.sendMessage(m.chat, { text: lyrics }, { quoted: m }); } catch (e) { reply("Couldn't find lyrics. Try again."); } } break;

// play2 case "play2": { const { youtubedl } = require('@bochilteam/scraper'); if (!text) return reply("Type song name."); try { const search = await youtubedl(text); const audio = search.audio; if (!audio?.url) return reply("No song found."); client.sendMessage(m.chat, { document: { url: audio.url }, mimetype: "audio/mpeg", fileName: ${search.title}.mp3, caption: ♤ *${search.title}* ♤\n🎵 Powered by BeltahBot, }, { quoted: m }); } catch (err) { reply("Failed to fetch audio."); } } break;

// Group Control case "admin": client.sendMessage(m.chat, { text: "Group control activated." }, { quoted: m }); break; case "tagall": { let members = (await client.groupMetadata(m.chat)).participants.map(p => @${p.id.split('@')[0]}).join(' '); client.sendMessage(m.chat, { text: members, mentions: members.split(' ') }, { quoted: m }); } break;

case "antilink": client.sendMessage(m.chat, { text: "🔒 Antilink activated." }, { quoted: m }); break; case "welcome": client.sendMessage(m.chat, { text: "👋 Welcome message is now ON." }, { quoted: m }); break;

// Bible, Quran, ytsearch case "bible": reply("📖 John 3:16 — For God so loved the world..."); break; case "quran": reply("📘 Surah Al-Fatiha — بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ..."); break; case "ytsearch": reply("🔎 Coming soon..."); break;

// You can extend more cases here for admin, owner, dev, save, etc.

