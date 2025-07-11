case "menu": 
await mp3d();

let cap = `
♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧
♤ *𝗕𝗘𝗟𝗧𝗔𝗛-𝗕𝗢𝗧 𝗠𝗘𝗡𝗨* ♤
◇ Stylish AI-Based WhatsApp Bot ◇
♡ Powered by Ishaq Ibrahim ♡
♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧♧

╔═══════❖•ೋ°🛠️°ೋ•❖═══════╗
║ ⚙️ *Bot Info*
╠══════════════════════╣
║ 👤 *User:* ${m.pushName}
║ ⚡ *Mode:* ${mode}
║ ⏱ *Uptime:* ${runtime(process.uptime())}
║ 🛡 *Bot:* 𝗕𝗘𝗟𝗧𝗔𝗛-𝗠𝗗
╚═══════❖•ೋ°🛠️°ೋ•❖═══════╝

╔═══════♧ 𝗠𝗘𝗗𝗜𝗔 ♧════════╗
║ 🎵 play2 - Download song
║ 📃 lyrics2 - Get song lyrics
║ 🧷 vv - ViewOnce retriever
║ 🗂 save - Save status
║ 🎙 record - Bot sends audio
╚═════════════════════════╝

╔═════♤ 𝗚𝗥𝗢𝗨𝗣 ♤═════════╗
║ 👑 admin - Group control
║ 🏷 tagall - Mention all
║ 🛑 antilink - Block links
╚═════════════════════════╝

╔═════◇ 𝗨𝗧𝗜𝗟𝗦 ◇═════════╗
║ 📖 bible - Get Bible verse
║ 📘 quran - Quran verse fetch
║ 🔎 ytsearch - YouTube search
╚═════════════════════════╝

♧ Enjoy your command! Use .help <cmd>`;

client.sendMessage(m.chat, {
  image: fs.readFileSync('./Media/blackmachant.jpg'),
  caption: cap,
}, { quoted: m });
break;

// 🧷 ViewOnce retriever
case "vv":
case "retrieve": {
  if (!m.quoted) return m.reply("Quote a viewonce message.");
  const quoted = m.msg?.contextInfo?.quotedMessage;

  if (quoted?.imageMessage) {
    const img = await client.downloadAndSaveMediaMessage(quoted.imageMessage);
    client.sendMessage(m.chat, { image: { url: img }, caption: `♧ Retrieved Image ♧` }, { quoted: m });
  }

  if (quoted?.videoMessage) {
    const vid = await client.downloadAndSaveMediaMessage(quoted.videoMessage);
    client.sendMessage(m.chat, { video: { url: vid }, caption: `♧ Retrieved Video ♧` }, { quoted: m });
  }
}
break;

// 📃 Lyrics fetcher
case "lyrics2": {
  try {
    if (!text) return reply("Provide a song name.");
    const searches = await Client.songs.search(text);
    const lyrics = await searches[0].lyrics();
    client.sendMessage(m.chat, { text: lyrics }, { quoted: m });
  } catch (e) {
    reply("Couldn't find lyrics. Try again.");
  }
}
break;

// 🎵 Music downloader
case "play2": {
  const { youtubedl } = require('@bochilteam/scraper');
  if (!text) return reply("Type song name.");
  try {
    const search = await youtubedl(text);
    const audio = search.audio;
    if (!audio?.url) return reply("No song found.");
    client.sendMessage(m.chat, {
      document: { url: audio.url },
      mimetype: "audio/mpeg",
      fileName: `${search.title}.mp3`,
      caption: `♤ *${search.title}* ♤\n🎵 Powered by BeltahBot`,
    }, { quoted: m });
  } catch (err) {
    reply("Failed to fetch audio.");
  }
}
break;

// 🗂 Save status media
case "save": {
  try {
    const quotedMessage = m.msg?.contextInfo?.quotedMessage;
    if (!quotedMessage) return m.reply('❌ Reply to a status message.');
    if (!m.quoted?.chat?.endsWith('@broadcast')) return m.reply('⚠️ That is not a status message.');
    const mediaBuffer = await client.downloadMediaMessage(m.quoted);
    if (!mediaBuffer) return m.reply('🚫 Failed to download status.');

    let payload = quotedMessage.imageMessage
      ? { image: mediaBuffer, caption: '📸 Saved status image', mimetype: 'image/jpeg' }
      : quotedMessage.videoMessage
      ? { video: mediaBuffer, caption: '🎥 Saved status video', mimetype: 'video/mp4' }
      : null;

    if (!payload) return m.reply('❌ Only image/video status can be saved.');
    await client.sendMessage(m.sender, payload, { quoted: m });
    return m.reply(`✅ Status saved successfully.`);
  } catch (err) {
    return m.reply(`❌ Error: ${err.message}`);
  }
}
break;

// 🎙 Simulate recording audio
case "record": {
  let { key } = await client.sendMessage(m.chat, {
    audio: fs.readFileSync('./Media/ponk.mp3'),
    mimetype: 'audio/mp4',
    ptt: true
  }, { quoted: m });
}
break;