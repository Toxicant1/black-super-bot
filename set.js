/**
 * set.js
 * Centralized configuration for the bot.
 *
 * Use process.env.SESSION to set your session in Render/Heroku/etc.
 * Accepted formats:
 *   - A MEGA URL:        https://mega.nz/file/<ID>#<KEY>
 *   - A MEGA id#key:     <ID>#<KEY>
 *   - A prefixed session: BLACK MD;;;<ID>#<KEY>
 *   - A 'session' prefixed string: sessionBLACK MD;;;<ID>#<KEY>
 *
 * The code below NORMALIZES these to: 'BLACK MD;;;<ID>#<KEY>'
 */

const FALLBACK_SESSION_RAW = 'BLACK MD;;;cm9UQaKS#0x6cQM_3nQkkJlwfdA5f8Uevqd2_1Lqg2cnFf85ao5A';
const rawFromEnv = (process.env.SESSION || process.env.SESSION_ID || '').trim();
const rawInput = rawFromEnv || FALLBACK_SESSION_RAW || ''; // priority: env > fallback > empty

/**
 * Normalize a variety of inputs into: 'BLACK MD;;;<ID>#<KEY>'
 * Returns normalized string, or empty string if cannot parse.
 */
function normalizeSession(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let s = raw.trim();

  // Remove surrounding quotes if any
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim();
  }

  // If the user accidentally prefixed with 'session'
  if (s.toLowerCase().startsWith('session')) {
    s = s.replace(/^session\s*/i, '').trim();
  }

  // If already in expected prefixed format
  if (s.startsWith('BLACK MD;;;')) {
    const rest = s.slice('BLACK MD;;;'.length).trim();
    if (rest.length > 5) return 'BLACK MD;;;' + rest;
    return '';
  }

  // If it's a MEGA URL like https://mega.nz/file/<id>#<key>
  try {
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const lower = s.toLowerCase();
      if (lower.includes('mega.nz')) {
        // find '/file/' and take everything after it
        const idx = s.indexOf('/file/');
        if (idx !== -1) {
          const after = s.slice(idx + '/file/'.length).trim();
          // after may contain additional path or query — keep up to whitespace/newline
          const idPart = after.split(/[?\s]/)[0];
          if (idPart.length > 5) return 'BLACK MD;;;' + idPart;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // If provided just an id#key (contains '#'), accept it
  if (s.includes('#') && s.length > 5) {
    return 'BLACK MD;;;' + s;
  }

  // If provided just an alphanumeric id (rare), accept if length plausible
  if (/^[A-Za-z0-9_-]{6,}$/.test(s)) {
    return 'BLACK MD;;;' + s;
  }

  // Could not parse
  return '';
}

const normalized = normalizeSession(rawInput);

// Session variables exported for index.js compatibility
// `session` is the string your existing code checks for and .replace("BLACK MD;;;", "")
// `sessionName` kept equal (so destructuring that expects it won't fail)
const session = normalized;      // e.g. 'BLACK MD;;;cm9UQaKS#0x6cQ...'
const sessionName = normalized;  // same as above for compatibility

// Helpful runtime logging (will appear on start)
if (!session) {
  console.warn('❌ set.js: SESSION not found or invalid.');
  console.warn('   Set process.env.SESSION to one of:');
  console.warn('     - a MEGA URL: https://mega.nz/file/<id>#<key>');
  console.warn("     - a MEGA id#key: <id>#<key>");
  console.warn("     - or 'BLACK MD;;;<id>#<key>'");
  console.warn('   For example: BLACK MD;;;cm9UQaKS#0x6cQM_3nQkkJlwfdA5f8Uevqd2_1Lqg2cnFf85ao5A');
} else {
  console.log('✅ set.js: session loaded and normalized.');
  // NOTE: do not print the full session in public logs if you care about secrecy.
  // console.log('DEBUG session:', session);
}

/* ---------- other configuration values (defaults preserved) ---------- */

const autobio = process.env.AUTOBIO || 'TRUE';
const autolike = process.env.AUTOLIKE_STATUS || 'TRUE';
const autoviewstatus = process.env.AUTOVIEW_STATUS || 'TRUE';
const welcomegoodbye = process.env.WELCOMEGOODBYE || 'FALSE';
const prefix = process.env.PREFIX || '.';
const appname = process.env.APP_NAME || '';
const herokuapi = process.env.HEROKU_API || '';
const gptdm = process.env.GPT_INBOX || 'FALSE';
const mode = process.env.MODE || 'PRIVATE';
const anticall = process.env.AUTOREJECT_CALL || 'TRUE';
const botname = process.env.BOTNAME || '𝐁𝐋𝐀𝐂𝐊𝐌𝐀𝐂𝐇𝐀𝐍𝐓 𝐁𝐎𝐓';
const antibot = process.env.ANTIBOT || 'FALSE';
const author = process.env.STICKER_AUTHOR || '𝗕𝗢𝗧';
const packname = process.env.STICKER_PACKNAME || '𝐁𝐋𝐀𝐂𝐊𝐌𝐀𝐂𝐇𝐀𝐍𝐓 𝐁𝐎𝐓';
const antitag = process.env.ANTITAG || 'TRUE';
const dev = process.env.DEV || '254741819582';
const menulink = process.env.MENU_LINK || 'https://files.catbox.moe/jxxwms.jpeg';
const menu = process.env.MENU_TYPE || 'IMAGE';
const DevRaven = (dev || '').split(',').map(x => x.trim()).filter(Boolean);
const badwordkick = process.env.BAD_WORD_KICK || 'FALSE';
const bad = process.env.BAD_WORD || 'fuck';
const autoread = process.env.AUTOREAD || 'FALSE';
const antidel = process.env.ANTIDELETE || 'TRUE';
const admin = process.env.ADMIN_MSG || '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗿𝗲𝘀𝗲𝗿𝘃𝗲𝗱 𝗳𝗼𝗿 𝗔𝗱𝗺𝗶𝗻𝘀!';
const group = process.env.GROUP_ONLY_MSG || '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗺𝗲𝗮𝗻𝘁 𝗳𝗼𝗿 𝗚𝗿𝗼𝘂𝗽𝘀!';
const botAdmin = process.env.BOT_ADMIN_MSG || '𝗜 𝗻𝗲𝗲𝗱 𝗔𝗱𝗺𝗶𝗻 𝗽𝗿𝗲𝗩𝗶𝗹𝗲𝗴𝗲𝘀!';
const NotOwner = process.env.NOT_OWNER_MSG || '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗺𝗲𝗮𝗻𝘁 𝗳𝗼𝗿 𝘁𝗵𝗲 𝗼𝘄𝗻𝗲𝗿!';
const wapresence = process.env.WA_PRESENCE || '🛰️ Link to Ishaq Mainframe...';
const antilink = process.env.ANTILINK || 'TRUE';
const mycode = process.env.CODE || '254';
const antiforeign = process.env.ANTIFOREIGN || 'TRUE';
const port = process.env.PORT || 10000;
const antilinkall = process.env.ANTILINK_ALL || 'TRUE';

/* ---------- final export ---------- */
module.exports = {
  // session values (normalized)
  session,
  sessionName,

  // core flags / behavior
  autobio,
  autolike,
  autoviewstatus,
  welcomegoodbye,
  prefix,
  appname,
  herokuapi,
  gptdm,
  mode,
  anticall,
  botname,
  antibot,
  author,
  packname,
  antitag,
  dev,
  DevRaven,
  badwordkick,
  bad,
  autoread,
  antidel,
  admin,
  group,
  botAdmin,
  NotOwner,
  wapresence,
  antilink,
  mycode,
  antiforeign,
  port,
  antilinkall
};