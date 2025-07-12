/* If it works, don't Fix it */
const {
  default: ravenConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidDecode,
  // Removed unused imports like downloadContentFromMessage, proto, getContentType to clean up
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom"); // For handling Baileys disconnect reasons
const fs = require("fs");
const path = require('path');
// Removed axios and FileType as they are not directly used in this main file
const express = require("express");
const chalk = require("chalk");
const figlet = require("figlet"); // For displaying the bot's name
const { File } = require('megajs'); // For downloading session from Mega.nz
const app = express();
const logger = pino({ level: 'silent' }); // Pino logger for Baileys

// Correctly aliasing 'await' from ravenfunc if it conflicts with a variable name.
// Assuming 'await' from ravenfunc is meant to be a helper function, not the JS keyword.
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await: _await, sleep } = require('./lib/ravenfunc');
// Import configuration settings from set.js
const { sessionName, session, mode, prefix, autobio, autolike, port, mycode, anticall, antiforeign, packname, autoviewstatus } = require("./set.js");
// In-memory store for WhatsApp data (messages, contacts)
const makeInMemoryStore = require('./store/store.js');
const store = makeInMemoryStore({ logger: logger.child({ stream: 'store' }) });
// Utility for colored console output
const color = (text, color) => (!color ? chalk.green(text) : chalk.keyword(color)(text));

// --- MODIFICATION START: Global 'client' variable ---
// Declare 'client' here so it can be accessed by both startRaven() and Express routes.
let client;
// --- MODIFICATION END ---

// --- MODIFICATION START: Authentication function with robust error handling ---
// This function attempts to download the session file if it doesn't exist.
async function authentication() {
  const credsPath = __dirname + '/sessions/creds.json';
  if (!fs.existsSync(credsPath)) {
    // Check if the 'session' variable from set.js is properly configured
    if (!session || typeof session !== 'string' || session.trim() === '') {
      console.error('ERROR: "session" variable in set.js or SESSION env is empty or malformed. Cannot download session file.');
      // If the bot cannot function without a pre-existing session, you might want to exit the process:
      // process.exit(1);
      return false; // Indicate authentication failure
    }

    const sessdata = session.replace("BLACK MD;;;", '');
    try {
      const filer = await File.fromURL(`https://mega.nz/file/${sessdata}`);

      // MODIFICATION: Use a Promise to correctly await the download and handle errors.
      const data = await new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) return reject(err); // If download fails, reject the promise
          resolve(data);
        });
      });

      // Write the downloaded session data synchronously.
      fs.writeFileSync(credsPath, data);
      console.log("Session downloaded successfully✅️");
      console.log("Connecting to WhatsApp ⏳️, Hold on for 3 minutes⌚️");
      return true; // Indicate successful authentication
    } catch (megaError) {
      console.error("CRITICAL ERROR: Failed to download session from Mega.nz:", megaError.message);
      console.error("Please ensure the 'session' variable in set.js holds a valid and accessible Mega.nz file ID.");
      // If session download is truly essential for bot operation, consider exiting:
      // process.exit(1);
      return false; // Indicate authentication failure
    }
  }
  return true; // creds.json already exists, so authentication is considered successful
}
// --- MODIFICATION END ---

// Main function to start the Baileys bot
async function startRaven() {
  // MODIFICATION: Ensure authentication is successful before proceeding with Baileys connection.
  const authSuccess = await authentication();
  // If authentication failed AND creds.json still doesn't exist, cannot proceed.
  if (!authSuccess && !fs.existsSync(__dirname + '/sessions/creds.json')) {
      console.error("Authentication failed. Cannot establish bot connection to WhatsApp.");
      // If the bot cannot run without successful authentication, uncomment to exit:
      // process.exit(1);
      return; // Stop startRaven execution
  }

  // Use MultiFileAuthState to manage session credentials
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
  // Fetch the latest Baileys version
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA v${version.join(".")}, isLatest: ${isLatest}`);
  console.log(color(figlet.textSync("BELTAH BOT", { font: "Standard" }), "green"));

  // Initialize Baileys client
  client = ravenConnect({ // Assign to the global 'client' variable
    logger: pino({ level: "silent" }), // Use pino for logging
    printQRInTerminal: false, // Prevents QR code from printing in console, relies on web interface
    browser: ["BELTAH AI", "Safari", "5.1.7"], // Custom browser identity
    auth: state, // Authentication state
    syncFullHistory: true, // Sync full chat history
  });

  store.bind(client.ev); // Bind store to client events

  // Event listener for connection updates
  client.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      // Handle different disconnect reasons for robust restarts
      if (reason === DisconnectReason.badSession || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
        console.log(`Connection closed due to ${reason}. Trying to restart...`);
        startRaven();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log("Logged out. Deleting session file and restarting to obtain a new session.");
        if (fs.existsSync(__dirname + '/sessions/creds.json')) {
          fs.unlinkSync(__dirname + '/sessions/creds.json'); // Delete old session file
        }
        startRaven(); // Restart to get a new session/pairing code
      } else {
        console.log(`Connection closed unexpectedly due to ${reason}. Trying to restart.`);
        startRaven();
      }
    } else if (connection === 'open') {
      console.log(color("Congrats, BELTAH BOT is now connected to this server ✅", "green"));

      const welcomeMessage = `✅ Connected to 【𝐁𝐋𝐀𝐂𝐊 𝐁𝐄𝐋𝐓𝐀𝐇 𝐁𝐎𝐓】\n👥 Mode »» ${mode}\n👤 Prefix »» ${prefix}`;

      // Send a welcome message to the bot's own ID if available
      if (client.user?.id) {
        await client.sendMessage(client.user.id, { text: welcomeMessage });
      } else {
        console.log("⚠️ No client.user.id found. Skipping startup welcome message.");
      }
    }
  });

  // Save credentials on update
  client.ev.on("creds.update", saveCreds);

  // Autobio feature
  if (autobio === 'TRUE') {
    setInterval(() => {
      const date = new Date();
      // Update profile status with current date/time and weekday for Nairobi timezone
      client.updateProfileStatus(`${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}.`);
    }, 10000); // Updates every 10 seconds
  }

  // Message Upsert Event - main message handler
  client.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages[0];
      if (!mek.message) return; // Ignore messages without content
      // Handle ephemeral messages
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      // Autoview status feature
      if (autoviewstatus === 'TRUE' && mek.key?.remoteJid === "status@broadcast") {
        client.readMessages([mek.key]); // Mark status as read
      }

      // Autolike status feature
      if (autolike === 'TRUE' && mek.key?.remoteJid === "status@broadcast") {
        const nickk = await client.decodeJid(client.user.id);
        if (!mek.status) { // Only react if it's not a status update about a reaction
          await client.sendMessage(mek.key.remoteJid, {
            react: { key: mek.key, text: '👻' } // React with a ghost emoji
          }, { statusJidList: [mek.key.participant, nickk] });
        }
      }

      // Public/Private mode check
      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      // Serialize message for easier handling
      let m = smsg(client, mek, store);
      // Require and run the main bot logic from blacks.js
      const raven = require("./blacks");
      raven(client, m, chatUpdate, store);
    } catch (err) {
      console.error("Error in messages.upsert:", err); // Log errors in message processing
    }
  });

  // Decode JID utility
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.public = true; // Set bot to public mode (can be overridden by MODE env)
  client.serializeM = (m) => smsg(client, m, store);

  // Other client methods can be added here if needed
}

// --- WEB SERVER ROUTES ---
// Serve static files from the 'pixel' directory (e.g., your index.html, CSS, images)
app.use(express.static("pixel"));

// Route for the main web page
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

// Endpoint to access creds.json (might be used for manual session management)
app.get("/pairing", (req, res) => {
  const pairingFilePath = path.join(__dirname, "/sessions/creds.json");
  if (fs.existsSync(pairingFilePath)) {
    res.sendFile(pairingFilePath);
  } else {
    res.status(404).json({ message: "Pairing code not yet generated." });
  }
});

// --- MODIFICATION START: New endpoint for /generate ---
// This endpoint is hit by your frontend's JavaScript (fetch('/generate')).
app.get('/generate', async (req, res) => {
    console.log("Received request for /generate endpoint from frontend.");
    // Ensure the Baileys client is initialized and connected before trying to generate a code.
    if (client && client.user) {
        // --- IMPORTANT: Placeholder for actual Baileys Linking Code Logic ---
        // To truly generate a WhatsApp linking code that triggers a message on the user's phone,
        // you would typically need to:
        // 1. Capture the user's phone number from the frontend (e.g., if you add an input field
        //    to your HTML and send it as `fetch('/generate?number=...')` or via POST).
        //    Example: const phoneNumber = req.query.number;
        // 2. Use Baileys functions to request a linking code for that specific number. This is
        //    part of the Baileys authentication flow and often involves listening to events.
        //    A simple `client.getPairingCode()` doesn't exist. You might need to initiate a new
        //    pairing process or use `client.requestPairingCode()` if available in your Baileys version.
        // 3. The generated code (a string) would then be sent back in the JSON response.
        // For now, this sends a basic placeholder response to confirm the endpoint is working.
        const pairingCode = "PLACEHOLDER_CODE_12345"; // Replace with real code logic later
        res.json({ code: pairingCode, message: "Code generation endpoint hit successfully!" });
    } else {
        // If the bot client isn't ready or connected, send a service unavailable status.
        res.status(503).json({ code: "NOT_READY", message: "Bot client not ready or connected. Please wait for connection or check server logs." });
    }
});
// --- MODIFICATION END ---

// --- MODIFICATION START: New endpoint to serve set.js data to the frontend ---
// This endpoint allows your frontend's JavaScript (fetch('/set.js')) to get settings.
app.get('/set.js', (req, res) => {
  console.log("Received request for /set.js endpoint from frontend.");
  const settings = require('./set.js'); // Load set.js as a Node module
  // Serve it back in a JavaScript format that your frontend expects (module.exports = { ... }).
  // Sending it as plain JSON and adjusting your frontend's JSON.parse would be a cleaner approach,
  // but this matches your existing frontend logic.
  res.type('application/javascript').send(`module.exports = ${JSON.stringify(settings)};`);
});
// --- MODIFICATION END ---

// Start the Express server, listening on the specified port
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

// Initiate the Baileys bot connection process
startRaven();

// File watcher to automatically restart the server if index.js is modified locally.
// This is more common in development environments.
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file]; // Clear cache to load new version
  require(file); // Reload the file
});
