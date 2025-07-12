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
const path = require('path'); // Node.js path module for handling file paths
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

// --- MODIFICATION START: Authentication function with robust error handling and directory creation ---
// This function attempts to download the session file if it doesn't exist, and ensures the directory exists.
async function authentication() {
  const sessionsDir = path.join(__dirname, 'sessions'); // Define the sessions directory path
  const credsPath = path.join(sessionsDir, 'creds.json'); // Define the full creds.json path

  // Check if the credentials file already exists
  if (!fs.existsSync(credsPath)) {
    // If session variable is not set or is empty/malformed, log an error and fail authentication
    if (!session || typeof session !== 'string' || session.trim() === '') {
      console.error('ERROR: "session" variable in set.js or SESSION env is empty or malformed. Cannot download session file.');
      // If the bot cannot function without a pre-existing session, you might want to uncomment to exit:
      // process.exit(1);
      return false; // Indicate authentication failure
    }

    const sessdata = session.replace("BLACK MD;;;", ''); // Extract the Mega.nz file ID
    try {
      const filer = await File.fromURL(`https://mega.nz/file/${sessdata}`);

      // Use a Promise to correctly await the download and handle potential errors during download.
      const data = await new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) return reject(err); // If download fails, reject the promise
          resolve(data);
        });
      });

      // --- CRITICAL FIX: Ensure 'sessions' directory exists before writing the file ---
      if (!fs.existsSync(sessionsDir)) {
          console.log(`Creating missing sessions directory: ${sessionsDir}`);
          fs.mkdirSync(sessionsDir, { recursive: true }); // Create directory and any necessary parent directories
      }
      // --- END CRITICAL FIX ---

      fs.writeFileSync(credsPath, data); // Write the downloaded session data synchronously
      console.log("Session downloaded successfully✅️");
      console.log("Connecting to WhatsApp ⏳️, Hold on for 3 minutes⌚️");
      return true; // Indicate successful authentication
    } catch (megaError) {
      // Catch any errors that occur during the Mega.nz download process
      console.error("CRITICAL ERROR: Failed to download session from Mega.nz:", megaError.message);
      console.error("Please ensure the 'session' variable in set.js holds a valid and accessible Mega.nz file ID.");
      // If session download is truly essential for bot operation, consider uncommenting to exit:
      // process.exit(1);
      return false; // Indicate authentication failure
    }
  }
  return true; // creds.json already exists, so authentication is considered successful
}
// --- MODIFICATION END ---

// Main function to start the Baileys bot connection
async function startRaven() {
  // Ensure authentication is successful (session file exists or downloaded) before proceeding.
  const authSuccess = await authentication();
  if (!authSuccess) {
      console.error("Authentication failed. Cannot establish bot connection to WhatsApp.");
      // If the bot cannot run without successful authentication, you might uncomment to exit:
      // process.exit(1);
      return; // Stop startRaven execution if authentication fails
  }

  // Use MultiFileAuthState to manage session credentials (stored in the 'sessions' directory)
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
  // Fetch the latest compatible Baileys WhatsApp version
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA v${version.join(".")}, isLatest: ${isLatest}`);
  // Display a fancy bot name in the console
  console.log(color(figlet.textSync("BELTAH BOT", { font: "Standard" }), "green"));

  // Initialize Baileys client connection
  client = ravenConnect({ // Assign to the global 'client' variable
    logger: pino({ level: "silent" }), // Use pino for silent logging (less console clutter)
    printQRInTerminal: false, // Prevents QR code from printing in console; we'll use the web interface
    browser: ["BELTAH AI", "Safari", "5.1.7"], // Custom browser identity for WhatsApp
    auth: state, // Authentication state loaded from creds.json
    syncFullHistory: true, // Sync full chat history (can be resource-intensive for large chats)
  });

  store.bind(client.ev); // Bind the in-memory store to client events for message/contact management

  // Event listener for connection updates (e.g., 'open', 'close', 'connecting')
  client.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      // Determine the reason for disconnect using Boom
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      // Handle different disconnect reasons for robust restarts
      if (reason === DisconnectReason.badSession || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
        console.log(`Connection closed due to ${reason}. Trying to restart...`);
        startRaven(); // Attempt to restart the bot connection
      } else if (reason === DisconnectReason.loggedOut) {
        // If logged out, delete the session file and restart to get a new session
        console.log("Logged out. Deleting session file and restarting to obtain a new session.");
        if (fs.existsSync(__dirname + '/sessions/creds.json')) {
          fs.unlinkSync(__dirname + '/sessions/creds.json'); // Delete old session file
        }
        startRaven(); // Restart the bot to trigger a new pairing process
      } else {
        console.log(`Connection closed unexpectedly due to ${reason}. Trying to restart.`);
        startRaven(); // Attempt to restart for other reasons
      }
    } else if (connection === 'open') {
      console.log(color("Congrats, BELTAH BOT is now connected to this server ✅", "green"));

      const welcomeMessage = `✅ Connected to 【𝐁𝐋𝐀𝐂𝐊 𝐁𝐄𝐋𝐓𝐀𝐇 𝐁𝐎𝐓】\n👥 Mode »» ${mode}\n👤 Prefix »» ${prefix}`;

      // Send a welcome message to the bot's own WhatsApp ID if available
      if (client.user?.id) {
        await client.sendMessage(client.user.id, { text: welcomeMessage });
      } else {
        console.log("⚠️ No client.user.id found. Skipping startup welcome message.");
      }
    }
  });

  // Event listener to save credentials when they are updated (e.g., new keys generated)
  client.ev.on("creds.update", saveCreds);

  // Autobio feature: automatically updates bot's profile status/bio
  if (autobio === 'TRUE') {
    setInterval(() => {
      const date = new Date();
      // Set bio to current date/time and weekday in Africa/Nairobi timezone
      client.updateProfileStatus(`${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}.`);
    }, 10000); // Updates every 10 seconds
  }

  // Message Upsert Event: This is the main handler for incoming messages/updates
  client.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages[0]; // Get the first message in the update
      if (!mek.message) return; // Ignore messages without actual content
      // Handle ephemeral messages (messages with disappearing settings)
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      // Autoview status feature: automatically views WhatsApp statuses
      if (autoviewstatus === 'TRUE' && mek.key?.remoteJid === "status@broadcast") {
        client.readMessages([mek.key]); // Mark status as read
      }

      // Autolike status feature: automatically reacts to WhatsApp statuses
      if (autolike === 'TRUE' && mek.key?.remoteJid === "status@broadcast") {
        const nickk = await client.decodeJid(client.user.id);
        if (!mek.status) { // Only react if it's not a status update about a reaction itself
          await client.sendMessage(mek.key.remoteJid, {
            react: { key: mek.key, text: '👻' } // React with a ghost emoji
          }, { statusJidList: [mek.key.participant, nickk] });
        }
      }

      // Public/Private mode check: if bot is not public and message is not from self, ignore
      // (This logic needs to be fully defined by your 'client.public' variable and 'mode' from set.js)
      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      // Serialize message for easier handling by bot logic
      let m = smsg(client, mek, store);
      // Require and run the main bot logic from 'blacks.js'
      const raven = require("./blacks"); // Ensure blacks.js exists and exports a function
      raven(client, m, chatUpdate, store);
    } catch (err) {
      console.error("Error in messages.upsert event:", err); // Log any errors during message processing
    }
  });

  // Utility function to decode JID (Jabber ID)
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) { // Checks if JID has a device suffix (e.g., 1234567890:1@s.whatsapp.net)
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.public = true; // Set bot to public mode by default (can be controlled by 'mode' in set.js)
  client.serializeM = (m) => smsg(client, m, store); // Method to serialize messages for consistent handling

  // Other client methods or event listeners can be added here if needed
}


// --- EXPRESS WEB SERVER ROUTES ---
// Middleware to parse JSON request bodies
app.use(express.json()); // <--- ADDED THIS LINE

// Serve static files from the 'pixel' directory (e.g., your index.html, CSS, images)
app.use(express.static("pixel"));

// Route for the main web page (index.html)
app.get("/", (req, res) => res.sendFile(__dirname + "/pixel/index.html")); // <--- Ensure path is correct, assuming index.html is in 'pixel'

// Endpoint to access creds.json (might be used for manual session management/QR display)
// Consider if exposing creds.json directly is desired or secure.
app.get("/pairing", (req, res) => {
  const pairingFilePath = path.join(__dirname, "/sessions/creds.json");
  if (fs.existsSync(pairingFilePath)) {
    res.sendFile(pairingFilePath); // If session file exists, send it
  } else {
    res.status(404).json({ message: "Pairing code not yet generated." }); // If not, return 404
  }
});

// --- MODIFICATION START: Updated endpoint for /generate to handle POST with phone number ---
app.post('/generate', async (req, res) => { // Changed to POST
    const { number } = req.body; // Extract number from JSON request body

    console.log(`Received request for /generate endpoint for number: ${number}`);

    // Basic validation for the number received from frontend
    if (!number || typeof number !== 'string' || !number.startsWith('+') || number.length < 10) {
        return res.status(400).json({ message: "Invalid phone number provided. Must start with '+' and include country code." });
    }

    // Ensure the Baileys client is initialized and connected before trying to generate a code.
    if (!client || !client.user) {
        return res.status(503).json({ code: "NOT_READY", message: "Bot client not ready or connected. Please wait for connection or check server logs." });
    }

    try {
        // --- ACTUAL Baileys Linking Code Logic ---
        // This attempts to request a pairing code. Baileys will send a message
        // to the provided number with the code.
        const pairingCode = await client.requestPairingCode(number); // Use Baileys function

        if (pairingCode) {
            console.log(`Generated pairing code for ${number}: ${pairingCode}`);
            res.json({ code: pairingCode, message: "Pairing code generated and sent to your WhatsApp!" });
        } else {
            // This case might happen if requestPairingCode returns null/undefined
            console.error(`Failed to generate pairing code for ${number}: Baileys returned no code.`);
            res.status(500).json({ message: "Failed to generate pairing code. Please try again." });
        }
    } catch (error) {
        console.error(`Error generating pairing code for ${number}:`, error);
        res.status(500).json({ message: `An error occurred while generating code: ${error.message}` });
    }
});
// --- MODIFICATION END ---

// --- REMOVED THIS ENDPOINT FOR SECURITY REASONS ---
// app.get('/set.js', (req, res) => { /* ... security risk ... */ });
// --- END REMOVAL ---

// Start the Express server, listening on the specified port from set.js
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

// Initiate the Baileys bot connection process
startRaven();

// File watcher to automatically restart the server if index.js is modified locally.
// This is more common in development environments.
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file); // Unwatch the old file
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file]; // Clear module cache to load the new version
  require(file); // Reload the file
});
