// 📁 Black.js | BeltahBot Core Script // 🔐 Locked to: +254741819582 // 🧠 AI Stack: Gminae → CrewDrew → ChatGPT

const fs = require('fs'); const path = require('path'); const chalk = require('chalk'); const moment = require('moment-timezone'); const { exec } = require('child_process');

// 🎭 Media Paths const menuImage = './black-super-bot/blackmachant.jpg'; const aliveAudio = './black-super-bot/Media/alive.mp3'; const songPreview = './black-super-bot/Media/ponk.mp3';

// 🔒 Owner Lock const OWNER_NUMBER = '+254741819582';

// 🔄 Autobio presets const bios = [ '⚫ Silent moves, loud results.', '💀 Beltah runs in the shadows.', '🧠 I'm online, but you're not ready.', '🐍 Beltah's watching, silently.', '👻 Ghost mode activated.', '🩸 Dripping silence.', '🎭 Not a bot. Not a human. Something darker.', '🧬 Code twisted in mystery.', '🌒 Lurking in your DMs.', '🗡️ Wounds unseen, presence unknown.', '⚰️ Speak my name, feel my presence.', '💣 Beltah doesn't knock.', '👁️‍🗨️ Eyes you can't see.', '🔮 You summoned darkness.', '🦇 Beltah: Echoes of the unseen.', '🚬 Smokin' silence.', '🧛‍♂️ No sunlight, just presence.', '🌑 Night-coded.', '🖤 Nothing but void.', '⛓️ Glitched soul in the matrix.' ];

// ⚙️ Toggles let autobio = false; let autostatus = false; let autolike = false; let antidelete = false;

// 🧠 Core Commands async function handleCommand(cmd, args, sender, sendMessage) { const user = sender.split('@')[0]; const isOwner = sender.includes(OWNER_NUMBER);

switch (cmd.toLowerCase()) { case 'menu': { const menuText =  ╔══ 🎮 BELTAH MENU [🔒 Locked to ${OWNER_NUMBER}] ║ ║ 🔧 .autobio on/off ║ 🎭 .autostatus on/off ║ ❤️ .autolike on/off ║ 🛡️ .antidelete on/off ║ 🎧 .song <query> ║ 💣 .hack <victim> ║ 🧾 .repo ║ 🎙️ .alive ║ 👁️ .statusv ║ 🔐 .locknum ╚═══════════════════════; return sendMessage(sender, { image: fs.readFileSync(menuImage), caption: menuText }); }

case 'alive': {
  return sendMessage(sender, { audio: fs.readFileSync(aliveAudio), mimetype: 'audio/mp4', ptt: true });
}

case 'autobio': {
  if (!args[0]) return sendMessage(sender, '⚙️ Use .autobio on/off');
  autobio = args[0].toLowerCase() === 'on';
  return sendMessage(sender, `✅ Autobio ${autobio ? 'activated' : 'deactivated'}`);
}

case 'autostatus': {
  if (!args[0]) return sendMessage(sender, '⚙️ Use .autostatus on/off');
  autostatus = args[0].toLowerCase() === 'on';
  return sendMessage(sender, `✅ Autostatus ${autostatus ? 'on' : 'off'}`);
}

case 'autolike': {
  if (!args[0]) return sendMessage(sender, '⚙️ Use .autolike on/off');
  autolike = args[0].toLowerCase() === 'on';
  return sendMessage(sender, `✅ Autolike ${autolike ? 'enabled' : 'disabled'}`);
}

case 'antidelete': {
  if (!args[0]) return sendMessage(sender, '⚙️ Use .antidelete on/off');
  antidelete = args[0].toLowerCase() === 'on';
  return sendMessage(sender, `🛡️ Antidelete ${antidelete ? 'on' : 'off'}`);
}

case 'song': {
  const query = args.join(' ');
  if (!query) return sendMessage(sender, '🎵 Provide a song name.');
  return sendMessage(sender, { audio: fs.readFileSync(songPreview), mimetype: 'audio/mp4', ptt: true, caption: `🎧 Preview for: ${query}` });
}

case 'hack': {
  if (!isOwner) return sendMessage(sender, '⛔ This command is owner-only.');
  const victim = args.join(' ') || 'unknown';
  const now = moment().tz('Africa/Nairobi');
  const logHeader = `🧠 Real-Time Intel\n🎯 Target Locked: ${victim}\n🌍 Location: Kenya, Africa\n⏰ Timezone: EAT | Local Time: ${now.format('hh:mm:ss A')}`;
  const stages = [
    '[🚨] Injecting Malware... ▓▓▓░░░░░░░ 35%',
    '[🐞] Deploying Virus... ▓▓▓▓▓░░░░░ 60%',
    '[💀] Wiping Data... ▓▓▓▓▓▓▓▓▓░ 95%'
  ];
  await sendMessage(sender, logHeader);
  for (let stage of stages) {
    await new Promise(resolve => setTimeout(resolve, 1300));
    await sendMessage(sender, stage);
  }
  return sendMessage(sender, '✅ Operation Complete\n🔓 Time Taken: 00:07:42');
}

case 'repo': {
  return sendMessage(sender, '📁 *BeltahBot Repo:* github.com/Toxicant1/BeltahBot-MD');
}

case 'statusv': {
  return sendMessage(sender, '👁️ Viewing statuses... (mocked)');
}

case 'locknum': {
  return sendMessage(sender, `🔐 Bot is currently locked to: ${OWNER_NUMBER}`);
}

default:
  return sendMessage(sender, '❓ Unknown command. Type .menu to view options.');

} }

module.exports = handleCommand;

// 🔄 Optional Bio Rotator setInterval(() => { if (autobio) { const randomBio = bios[Math.floor(Math.random() * bios.length)]; console.log(chalk.cyan([AUTOBIO] Updated: ${randomBio})); // Simulated bio update (you'd call your bot API here) } }, 1800000); // Every 30 min

