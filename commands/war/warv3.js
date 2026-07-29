/* warv3.js — v3.5.1
   - Added lyricalFallback(ref, used) producing real lyrical lines (no random code tokens)
   - Replaced any final-random-token fallback with lyricalFallback usage
   - Kept language and structure unchanged (English/Urdu mix)
   - Minor stability tweaks to ensure pool never emits random code tokens
*/

module.exports.config = {
  name: "warv3",
  version: "3.5.1",
  hasPermssion: 0,
  credits: "MrDeveloper & Grok (upgraded)",
  usePrefix: true,
  description:
    "High-lyricism Urdu/English rap-diss generator — denser templates, better fallback, controlled swear injection.",
  commandCategory: "group",
  usages:
    "warv3 [optional: @username | random] [optional: maxLines] [optional: delayMs] [optional: intensity:normal|hard|lethal|brutal|mixed|multisyl] [--swear | swear:force] [--burst]",
  cooldowns: 5,
  dependencies: {},
};

// --- SWEAR CONFIG (tweak these) ---
const SWEAR_INSERT_PROB = 0.32; // default probability to inject a swear into any generated line
const MIN_SWEAR_SPACING = 3; // minimum non-swear lines between inserted swear lines
const MAX_SWEARS_RATIO = 0.5; // cap swears per run as a fraction of maxLines (50% default)

// ----------------- KEEP THIS FUNCTION EXACT -----------------
async function resolveDisplayNames(api, event, senderId, targetId) {
  let senderName = null;
  let targetName = null;
  let threadInfo = null;

  if (event.mentions) {
    for (const [id, data] of Object.entries(event.mentions)) {
      if (String(id) === String(senderId) && data?.name) senderName = data.name;
      if (String(id) === String(targetId) && data?.name) targetName = data.name;
    }
  }

  if (!senderName && event.senderName) senderName = event.senderName;

  try {
    threadInfo = await new Promise((resolve) => {
      api.getThreadInfo(event.threadID, (err, info) =>
        resolve(err ? null : info),
      );
    });
  } catch (e) {
    console.warn("⚠ Could not fetch thread info:", e.error || e.message || e);
  }

  if (threadInfo?.userInfo && Array.isArray(threadInfo.userInfo)) {
    const senderData = threadInfo.userInfo.find(
      (u) => String(u.id) === String(senderId),
    );
    const targetData = threadInfo.userInfo.find(
      (u) => String(u.id) === String(targetId),
    );
    if (senderData?.name) senderName = senderName || senderData.name;
    if (targetData?.name) targetName = targetName || targetData.name;
  }

  if (api?.getUserInfo && (senderName === null || targetName === null)) {
    try {
      const ids = [];
      if (senderId && !senderName) ids.push(senderId);
      if (targetId && !targetName) ids.push(targetId);
      if (ids.length) {
        const res = await new Promise((resolve) => {
          api.getUserInfo(ids, (err, data) => resolve(err ? null : data));
        });
        if (res) {
          if (res[senderId]?.name)
            senderName = senderName || res[senderId].name;
          if (res[targetId]?.name)
            targetName = targetName || res[targetId].name;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    senderName: senderName || "Aap",
    targetName: targetName || "Koi Bhi",
  };
}
// ------------------------------------------------------------

// ---------------- URDU/EN NORMALIZER (expanded) ----------------
const URDU_NORMALIZER = (() => {
  const normMap = {
    mera: "mera",
    meraa: "mera",
    meray: "mera",
    meri: "meri",
    tera: "tera",
    teri: "teri",
    tu: "tu",
    tum: "tum",
    aap: "aap",
    mein: "main",
    main: "main",
    bhai: "bhai",
    yaar: "yaar",
    beta: "beta",
    biryani: "biryani",
    chai: "chai",
    lahore: "Lahore",
    karachi: "Karachi",
    zamzama: "Zamzama",
    talha: "Talha",
    kr$na: "Kr$na",
    krsna: "Kr$na",
    "faris shafi": "Faris Shafi",
    savage: "Savage",
    fibonacci: "Fibonacci",
    "mic drop": "mic drop",
  };

  // Swear tokens — intentionally avoid slurs targeting protected classes
  const swearList = [
    // Urdu-heavy harsh tokens + English insults (non-protected)
    "kameena",
    "bhen",
    "chodu",
    "chutiye",
    "bharwe",
    "bhosarpappu",
    "loru",
    "bhosdika",
    "gandu",
    "randi",
    "madarchod",
    "bhadwa",
    "faker",
    "poser",
    "bootleg",
    "copycat",
    "trash",
    "loser",
    "clown",
    "fraud",
    "scum",
    "bastard",
    "screw you",
    "die",
    "rot",
    "damn",
    "hell",
    "teri chut me mera aham"
  ];

  // runtime pool
  const swearPool = [...new Set(swearList.filter(Boolean))];

  function collapseRepeats(s, n = 2) {
    return s.replace(/(.)\1{2,}/g, (_, ch) => ch.repeat(n));
  }

  function preserveMentions(text) {
    const mentions = [];
    let idx = 0;
    const replaced = text.replace(/@\[?([^\]\s,!:?()@]{1,60})\]?/g, (m) => {
      const tag = `__MENTION_${idx}__`;
      mentions.push({ tag, orig: m });
      idx++;
      return tag;
    });
    return { replaced, mentions };
  }
  function restoreMentions(text, mentions) {
    let res = text;
    for (const m of mentions) res = res.replace(new RegExp(m.tag, "g"), m.orig);
    return res;
  }

  function fixSpacing(s) {
    s = s.replace(/\s+/g, " ");
    s = s.replace(/\s+([,!?;:.])/g, "$1");
    s = s.replace(/([,!?;:.])([^\s])/g, "$1 $2");
    return s.trim();
  }

  function normalize(text, opts = {}) {
    const options = Object.assign(
      {
        maxRepeat: 2,
        censorLevel: 0,
        mapRoman: true,
        lowerCase: true,
        preserveMentions: true,
      },
      opts,
    );

    if (!text || typeof text !== "string")
      return { text: text || "", meta: { censored: false, original: text } };

    let mentions = [];
    let working = text;
    if (options.preserveMentions) {
      const res = preserveMentions(working);
      working = res.replaced;
      mentions = res.mentions;
    }

    if (options.lowerCase) working = working.toLowerCase();
    working = collapseRepeats(working, options.maxRepeat);

    if (options.mapRoman) {
      const parts = working.split(/(\s+|[,.!?;:()—\-])/g);
      for (let i = 0; i < parts.length; i++) {
        const w = parts[i];
        if (!w || /^\s+$/.test(w) || /^[,\.!\?\;\:\(\)—\-]$/.test(w)) continue;
        const key = w.toLowerCase();
        if (normMap && normMap.hasOwnProperty(key)) parts[i] = normMap[key];
        else if (swearList.includes(key)) {
          if (options.censorLevel === 1)
            parts[i] = key[0] + "*".repeat(Math.max(1, key.length - 1));
          else if (options.censorLevel === 2) parts[i] = "*".repeat(key.length);
        }
      }
      working = parts.join("");
    }

    working = fixSpacing(working);

    if (options.preserveMentions && mentions.length) {
      working = restoreMentions(working, mentions);
    }

    return { text: working, meta: { censored: false, original: text } };
  }

  return { normalize, swearPool };
})();
// ------------------------------------------------------------

// ------------------- REFERENCE BANK (templates only) -------------------------
const refBank = {
  cities: [
    "Lahore",
    "Karachi",
    "Islamabad",
    "Multan",
    "Rawalpindi",
    "Quetta",
    "Faisalabad",
    "Peshawar",
    "Sialkot",
    "Zamzama",
    "Gulberg",
    "Clifton",
  ],
  foods: [
    "biryani",
    "nihari",
    "bun kebab",
    "haleem",
    "chai",
    "gulab jamun",
    "samosa",
    "karahi",
    "naan",
    "kebab",
    "paratha",
    "jalebi",
  ],
  icons: [
    "Nusrat",
    "Noor Jehan",
    "Bohemia",
    "Eminem",
    "Kr$na",
    "Faris Shafi",
    "Talha Anjum",
    "Talhah Yunus",
    "Ghalib",
    "Iqbal",
  ],
  actors: ["Naseer", "Fawad", "Humayun", "Mahira", "Fahad", "Saba", "Atif"],
  slang: [
    "bhai",
    "beta",
    "yaar",
    "adda",
    "sher",
    "bhaiya",
    "chod",
    "kameena",
    "malli",
  ],
  tech: [
    "quantum",
    "server",
    "bandwidth",
    "algorithm",
    "cache",
    "latency",
    "packet",
    "CPU",
    "GPU",
    "firewall",
    "router",
  ],
  street: ["Gulberg", "Clifton", "Korangi", "Lyari", "Zamzama", "Faisal Chowk"],
  themes: [
    "honour",
    "hustle",
    "refunds",
    "legacy",
    "credit",
    "fame",
    "credit score",
    "street debt",
    "prophecy",
    "clout",
    "algorithm",
  ],
  verbs: [
    "slice",
    "burn",
    "erase",
    "archive",
    "download",
    "crash",
    "hack",
    "expose",
    "cancel",
    "outclass",
    "decimate",
  ],
  insults: [
    "clearance sale",
    "used goods",
    "proxy rapper",
    "store-bought bars",
    "bootleg",
    "keyboard warrior",
    "mimic",
    "copy-paste",
    "demo tape",
  ],
  metaphors: [
    "limited edition",
    "warranty expired",
    "diamond-cut",
    "glass-lines",
    "quantum flow",
    "Fibonacci loop",
    "prime sequence",
    "mic drop",
  ],
  storySeeds: [
    "late-night chai at aadda",
    "lost wallet on Zamzama",
    "stage with broken mic",
    "uncle's shop sign",
    "unpaid album credit",
    "old mixtape burn",
  ],
};
// ------------------------------------------------------------

const pick = (arr) =>
  Array.isArray(arr) && arr.length
    ? arr[Math.floor(Math.random() * arr.length)]
    : "";

// ---------------- similarity helpers -----------------------
function collapseToTokens(s) {
  if (!s || typeof s !== "string") return [];
  return s
    .toLowerCase()
    .replace(/[@#]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
function tokenDice(a, b) {
  const ta = new Set(collapseToTokens(a));
  const tb = new Set(collapseToTokens(b));
  if (!ta.size && !tb.size) return 1;
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const x of ta) if (tb.has(x)) inter++;
  return (2 * inter) / (ta.size + tb.size);
}
function isTooSimilar(candidate, usedArray, threshold = 0.42) {
  for (const u of usedArray) {
    const score = tokenDice(candidate, u);
    if (score >= threshold) return true;
  }
  return false;
}
// ------------------------------------------------------------

// ----------------- template intensity selector ----------------
function pickTemplateByIntensity(bank, intensity) {
  if (!bank) return () => "";
  try {
    if (intensity === "normal" && bank.normal)
      return bank.normal[Math.floor(Math.random() * bank.normal.length)];
    if (intensity === "hard" && bank.hard)
      return bank.hard[Math.floor(Math.random() * bank.hard.length)];
    if (intensity === "lethal" && bank.lethal)
      return bank.lethal[Math.floor(Math.random() * bank.lethal.length)];
    if (intensity === "brutal" && bank.brutal)
      return bank.brutal[Math.floor(Math.random() * bank.brutal.length)];
    if (intensity === "multisyl" && bank.multisyl)
      return bank.multisyl[Math.floor(Math.random() * bank.multisyl.length)];

    const toss = Math.random() * 100;
    if (toss < 30 && bank.multisyl)
      return bank.multisyl[Math.floor(Math.random() * bank.multisyl.length)];
    if (toss < 55 && bank.internal)
      return bank.internal[Math.floor(Math.random() * bank.internal.length)];
    if (toss < 80 && bank.wordplay)
      return bank.wordplay[Math.floor(Math.random() * bank.wordplay.length)];
    if (toss < 92 && bank.lethal)
      return bank.lethal[Math.floor(Math.random() * bank.lethal.length)];
    if (bank.brutal) return bank.brutal[Math.floor(Math.random() * bank.brutal.length)];
  } catch (e) {
    return () => "";
  }
  return () => "";
}
// ------------------------------------------------------------

// --------------------- TEMPLATES (denser, English/Urdu mix) ----------------------------
const templates = {
  normal: [
    (r) =>
      `${pick(r.cities)} edition — tu,${pick(r.insults)} ab crowd bole: next act, please.`,
    (r) =>
      `${pick(r.foods)} ka flavour, tu ${pick(r.insults)} microwave — slow-brew mera savour; tera hype fade.`,
    (r) =>
      `Main maloom, metaphor machine — tu ${pick(r.insults)} mimic minimal, mera method mean.`,
    (r) => `Cash cadence, credit cycles — crowd count high; teri tally micro.`,
    (r) => `Timeline tight, main titan — timing tight, jab main rhyme likhun.`,
    (r) => `Stage check: tera verse demo; meri release platinum, shelf full ${pick(r.insults)}.`,
  ],
  hard: [
    (r) =>
      `Warranty expired: tera bars ${pick(r.insults)} — koi refund nahi, sirf silence.`,
    (r) =>
      `Algorithm mera; tera analytics bluff — ${pick(r.insults)} numbers bolte: tu shelf empty, I sell out.`,
    (r) =>
      `Multi-syllable missile — articulate, decimate; teri cadence replicate, meri innovate.`,
    (r) =>
      `Pipe leak flow: ${pick(r.insults)} tera buffering; mera stream steady — servers crash, crowd steady.`,
    (r) => `Sequence prime — no repeats; teri ${pick(r.insults)} loop stuck, mera arc elite.`,
    (r) =>
      `Internal: "credit, credence, credentials" — ledger mera, tera balance minimal.`,
  ],
  lethal: [
    (r) =>
      `Tera hype 32-bit; mera flow quantum — dekho compute, tera name gone.`,
    (r) =>
      `Main limited drop — tu bargain bin; meri autograph signed, tera sticker thin.`,
    (r) =>
      `Meri lines diamond-cut — teri lines glass; ek step, crack, crowd laugh, pass.`,
    (r) =>
      `Punchline surgical — ego sliced; audience claps, press release: 'disqualified'.`,
    (r) =>
      `${pick(r.foods)} stains tere CV pe — mujhe credit, tera credit zero.`,
    (r) =>
      `Mic silence: tera encore cancelled — refund queue, exit sign: vacate.`,
  ],
  brutal: [
    (r) =>
      `Career obituary: headline reads — "Local Rapper: Career Over" — crowd archive cleared.`,
    (r) =>
      `Verbal arson: main bars jalata; tera catalogue carbon — fans drop you, they abandon.`,
    (r) =>
      `Ego amputated: stump left; applause around; tu stage ko cross, crowd found.`,
    (r) =>
      `Diss forensic: evidence logged, receipts stamped — tera resume "failed experiment".`,
    (r) =>
      `Credibility bankrupt — auditors laugh; meri authenticity notarized, signed autograph.`,
    (r) =>
      `Tera verse bedtime story; mera verse thesis — scholars cite, critics feast.`,
  ],
  storytelling: [
    (r) =>
      `Raat chai, adda se story: mixtape lost, uncle laughed — ab crowd mera trophy.`,
    (r) =>
      `Once mixtape burned — door knock, neighbours came — ab stage mera name.`,
    (r) =>
      `Payment due: album unpaid — mera album sold-out, teri listing fade.`,
    (r) =>
      `Past chapter: unpaid rent, empty room — present: sold-out, billboard boom.`,
  ],
  multisyl: [
    (r) =>
      `Poly-syllable missile: articulate, eradicate, deliberate — teri cadence imitate; meri celebrate.`,
    (r) =>
      `Internal rhyme cluster: "credit, credence, credentials" — ledger mera, tera balance minimal.`,
    (r) =>
      `Multi-syllable cascade — consonant clash, vowel vault; tum repeat, main default.`
  ],
  internal: [
    (r) =>
      `Internal rhyme cluster: back-to-back — attack, crack; teri craft collapse, meri craft cash.`,
    (r) => `Echo chamber: clap, crack, clap — teri pattern trapped; mera pattern mapped.`,
  ],
  wordplay: [
    (r) =>
      `Biryani simile: layers on layers — teri bars flat, meri bars players.`,
    (r) =>
      `Warranty expired — tu used goods; sticker peel, critics reel, my reels flood.`,
  ],
  aggressive_story: [
    (r) =>
      `Gali se nikla bachcha — pockets empty; ab stage se ticket sold, deja-vu plenty.`,
    (r) => `Uncle kehata: write truth; ab truth mera beat par — youth salute.`,
  ],
};
// lethal extras
const lethalPackExtra = [
  (r) =>
    `Tera hype demo-mode, mera hype premium — tu skip, main headline premium.`,
  (r) =>
    `Tera name search: "error" — result not found; mera naam trending, front-page crowned.`,
  (r) =>
    `Recycled bars: factory reject; meri bars collectors pick, certified select.`,
  (r) => `Lyric clearance: tu bargain bin; meri vinyl spins, critics grin.`,
];
templates.lethal = (templates.lethal || []).concat(lethalPackExtra);
// ------------------------------------------------------------

// --------------- staticPool (varied) ---------------------
const staticPool = [
  {
    body: "Limited drop: tera version expired — signed, sealed, crowd verified. (clap)",
    at: 0,
  },
  {
    body: "Quantum flow: tera latency high, mera stream infinite — fans buffer, then pivot. (boom)",
    at: 0,
  },
  {
    body: "Diamond-cut bars — teri lines glass; step wrong, crack; crowd laugh — pass. (clap)",
    at: 0,
  },
  {
    body: "Final swing: tu out; main encore — mic drop; crowd echo: 'lethal'. (mic)",
    at: 0,
  },
];
// ------------------------------------------------------------

// helper used in pool builder: makeUniqueBody and synonyms (improved lyrical variants)
const brutalSuffixes = [
  "mic drop",
  "crowd silence",
  "crowd riot",
  "checkmate",
  "account closed",
  "refunds issued",
  "headline: 'Career Over'",
  "receipt: denied",
  "barcode expired",
  "label: defective",
  "proof filed",
  "verified failure",
  "signed autograph",
  "archive cleared",
];

const synonyms = {
  legacy: ["pedigree", "record", "pedestal", "catalogue"],
  hype: ["clout", "buzz", "hustle"],
  "used goods": ["preowned goods", "second-hand bars", "clearance leftovers"],
  "clearance sale": ["bargain bin", "store clearance", "final markdown"],
  "limited edition": ["one-off", "collectors' drop", "exclusive release"],
  "mic drop": ["mic silence", "stage quiet", "audience hush"],
  refund: ["return", "reclaim", "receipt void"],
};

function makeUniqueBody(base, usedArray) {
  if (!isTooSimilar(base, usedArray, 0.42)) return base;
  // try suffixes
  for (let i = 0; i < brutalSuffixes.length; i++) {
    const s = brutalSuffixes[Math.floor(Math.random() * brutalSuffixes.length)];
    const candidate = `${base} — ${s}`;
    if (!isTooSimilar(candidate, usedArray, 0.5)) return candidate;
  }
  // synonyms swap
  const keys = Object.keys(synonyms);
  for (let k = 0; k < keys.length; k++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    const variants = synonyms[key];
    if (!variants || !variants.length) continue;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("\\b" + escaped + "\\b", "i");
    if (regex.test(base)) {
      for (const v of variants) {
        const candidate = base.replace(regex, v);
        if (!isTooSimilar(candidate, usedArray, 0.5)) return candidate;
      }
    }
  }
  // attach an icon/actor mention
  for (let i = 0; i < 6; i++) {
    const extra = pick(refBank.icons.concat(refBank.actors));
    if (!extra) break;
    const candidate = `${base} — ref: ${extra}`;
    if (!isTooSimilar(candidate, usedArray, 0.5)) return candidate;
  }
  // small randomized suffix
  for (let i = 0; i < 4; i++) {
    const rnd = Math.random().toString(36).slice(2, 6);
    const candidate = `${base} (${rnd})`;
    if (!isTooSimilar(candidate, usedArray, 0.6)) return candidate;
  }
  return base;
}

// ----------------- lyricalFallback (no random codes) ------------------
// Produce a real lyrical line using template banks and refBank.
// This purposely avoids injecting meaningless "final code" tokens.
// Returns a string.
function lyricalFallback(ref = refBank, used = []) {
  // Strategy A: City + Food + verb + insult/swear
  const city = pick(ref.cities || []);
  const food = pick(ref.foods || []);
  const verb = pick(ref.verbs || []);
  const insult = pick(ref.insults || []);
  const swear = (URDU_NORMALIZER && URDU_NORMALIZER.swearPool && URDU_NORMALIZER.swearPool.length) ? pick(URDU_NORMALIZER.swearPool) : "";

  const candA = `${city ? city + " edition — " : ""}${food ? food + " ka ta'am, " : ""}tu ${insult || "used goods"}; mein ${verb || "erase"} karoon ${swear ? `— ${swear}` : ""}`.trim();
  if (!isTooSimilar(candA, used, 0.55)) return candA;

  // Strategy B: Multisyl + internal stitch + icon drop
  const ms = pick(templates.multisyl || []);
  const inl = pick(templates.internal || []);
  const msText = typeof ms === "function" ? ms(ref) : (ms || "");
  const inlText = typeof inl === "function" ? inl(ref) : (inl || "");
  const icon = pick(ref.icons || []);
  const candB = `${msText}${msText && inlText ? " — " : ""}${inlText}${icon ? ` — ref: ${icon}` : ""}${swear ? ` — ${swear}` : ""}`.trim();
  if (!isTooSimilar(candB, used, 0.55)) return candB;

  // Strategy C: Story payoff + lethal close
  const story = pick(templates.storytelling || []);
  const close = pick(templates.lethal || []);
  const storyText = typeof story === "function" ? story(ref) : (story || "");
  const closeText = typeof close === "function" ? close(ref) : (close || "");
  const candC = `${storyText}${storyText && closeText ? " — " : ""}${closeText}${swear ? ` — ${swear}` : ""}`.trim();
  if (!isTooSimilar(candC, used, 0.55)) return candC;

  // Strategy D: Wordplay + multisyl (safer)
  const wp = pick(templates.wordplay || []);
  const m2 = pick(templates.multisyl || []);
  const wpText = typeof wp === "function" ? wp(ref) : (wp || "");
  const m2Text = typeof m2 === "function" ? m2(ref) : (m2 || "");
  const candD = `${wpText}${wpText && m2Text ? " — " : ""}${m2Text}`.trim();
  if (!isTooSimilar(candD, used, 0.55)) return candD;

  // Strategy E: Brutal single with suffix
  const brutal = pick(templates.brutal || []);
  const brutalText = typeof brutal === "function" ? brutal(ref) : (brutal || "");
  const suffix = pick(brutalSuffixes);
  const candE = `${brutalText}${suffix ? " — " + suffix : ""}`.trim();
  if (!isTooSimilar(candE, used, 0.55)) return candE;

  // Last deterministic lyrical fallback (short, punchy, deterministic)
  const last = `Final cadence — lethal close, crowd echo`;
  if (!isTooSimilar(last, used, 0.6)) return last;

  // If all else fails, construct a safe deterministic line from refBank pieces
  const deterministic = `${pick(ref.cities || ["Lahore"])} edition — final cadence, signature drop`;
  return deterministic;
}
// ------------------------------------------------------------

// ----------------- Support: generate lethal burst (uses denser picks) -----------------
function generateBurst(used, swearMode) {
  const BURST_MIN = 3;
  const BURST_MAX = 5;
  const burstLen = BURST_MIN + Math.floor(Math.random() * (BURST_MAX - BURST_MIN + 1));
  const burstLines = [];
  let attempts = 0;
  while (burstLines.length < burstLen && attempts < burstLen * 8) {
    attempts++;
    // pick from lethal, brutal, multisyl, internal for dense bursts
    const sourcePool = Math.random() < 0.4 ? [].concat(templates.lethal, templates.brutal) : [].concat(templates.multisyl, templates.internal);
    const tmpl = pick(sourcePool);
    let raw = typeof tmpl === "function" ? tmpl(refBank) : tmpl || "";
    if (!raw) continue;
    // aggressive swear injection
    if (Array.isArray(URDU_NORMALIZER.swearPool) && URDU_NORMALIZER.swearPool.length) {
      const swear = pick(URDU_NORMALIZER.swearPool);
      const fmts = [` — ${swear}`, ` ( ${swear} )`, ` — ${swear}, mic drop`, ` — ${swear}, account closed`];
      raw = `${raw}${pick(fmts)}`;
    }
    if (!isTooSimilar(raw, used, 0.65)) {
      used.push(raw);
      burstLines.push({ body: raw, at: 0 });
    }
  }
  return burstLines;
}
// ------------------------------------------------------------

// ----------------- lyrical fallback wrapper used previously in file -----------------
function makeLyricalFallback(used, ref = refBank, swearMode = "normal") {
  // Try prioritized pools: multisyl -> internal -> lethal -> brutal -> wordplay -> storytelling -> extras
  const pools = [
    templates.multisyl || [],
    templates.internal || [],
    templates.lethal || [],
    templates.brutal || [],
    templates.wordplay || [],
    templates.storytelling || [],
    templates.aggressive_story || [],
    templates.normal || [],
  ];
  for (let p = 0; p < pools.length; p++) {
    const bank = pools[p];
    for (let i = 0; i < bank.length * 3; i++) {
      const tmpl = pick(bank);
      let cand = typeof tmpl === "function" ? tmpl(ref) : tmpl || "";
      if (!cand) continue;
      // aggressive swipe: attach a brutal suffix or swear (if allowed)
      if (URDU_NORMALIZER && URDU_NORMALIZER.swearPool && URDU_NORMALIZER.swearPool.length && Math.random() < 0.9) {
        cand = `${cand} — ${pick(URDU_NORMALIZER.swearPool)}`;
      } else {
        cand = `${cand} — ${pick(brutalSuffixes)}`;
      }
      if (!isTooSimilar(cand, used, 0.55)) {
        used.push(cand);
        return { body: cand, at: 0 };
      }
    }
  }

  // try stitching two lines
  for (let tries = 0; tries < 8; tries++) {
    const a = pick(Object.values(templates).flat());
    const b = pick(Object.values(templates).flat());
    const partA = typeof a === "function" ? a(ref) : (a || "");
    const partB = typeof b === "function" ? b(ref) : (b || "");
    if (!partA && !partB) continue;
    let candidate = `${partA} — ${partB}`;
    if (URDU_NORMALIZER && URDU_NORMALIZER.swearPool && URDU_NORMALIZER.swearPool.length) candidate = `${candidate} — ${pick(URDU_NORMALIZER.swearPool)}`;
    if (!isTooSimilar(candidate, used, 0.6)) {
      used.push(candidate);
      return { body: candidate, at: 0 };
    }
  }

  // final: call lyricalFallback (deterministic, no random-code tokens)
  const lyric = lyricalFallback(ref, used);
  if (lyric && !isTooSimilar(lyric, used, 0.6)) {
    used.push(lyric);
    return { body: lyric, at: 0 };
  }

  // last safe deterministic construct from refBank
  const deterministic = `${pick(ref.cities || ["Lahore"])} edition — final cadence, signature drop`;
  used.push(deterministic);
  return { body: deterministic, at: 0 };
}
// ------------------------------------------------------------

// ----------------- pool builder (swear injection + similarity-aware) ---------------
function buildMessagePool(options) {
  const {
    maxLines = 80,
    intensity = "mixed",
    ref = refBank,
    swearMode = "normal",
  } = options || {};
  const out = [];
  const used = []; // array used for similarity
  let attempts = 0;
  const MAX_ATTEMPTS = Math.max(800, maxLines * 20);

  // swear counters / spacing
  let lastSwearAt = -MIN_SWEAR_SPACING;
  let swearCount = 0;
  const MAX_SWEARS_PER_RUN = Math.max(
    1,
    Math.floor(maxLines * MAX_SWEARS_RATIO),
  );

  // ensure first line is a static-like lyric starter
  const starter = pick([].concat(staticPool.map(s=>s.body), templates.multisyl || [], templates.normal || []));
  const s0 = { body: starter || staticPool[0].body, at: 0 };
  out.push(s0);
  used.push(s0.body);

  while (out.length < maxLines && attempts < MAX_ATTEMPTS) {
    attempts++;
    let tmplFunc;
    const stage = Math.random();
    if (intensity === "brutal")
      tmplFunc = pickTemplateByIntensity(templates, "brutal");
    else if (intensity === "lethal")
      tmplFunc = pickTemplateByIntensity(templates, "lethal");
    else if (intensity === "hard")
      tmplFunc = pickTemplateByIntensity(templates, "hard");
    else if (intensity === "multisyl")
      tmplFunc = pickTemplateByIntensity(templates, "multisyl");
    else {
      if (stage < 0.35) tmplFunc = pickTemplateByIntensity(templates, "multisyl");
      else if (stage < 0.65) tmplFunc = pickTemplateByIntensity(templates, "internal");
      else if (stage < 0.9) tmplFunc = pickTemplateByIntensity(templates, "lethal");
      else tmplFunc = pickTemplateByIntensity(templates, "brutal");
    }

    tmplFunc = tmplFunc || (() => "");
    let raw = typeof tmplFunc === "function" ? tmplFunc(ref) : tmplFunc;
    if (!raw || !raw.trim()) continue;

    // attempt to make candidate sufficiently different from used array
    let candidate = raw;
    let made = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      if (!isTooSimilar(candidate, used, 0.42)) {
        made = true;
        break;
      }
      // try lethal/brutal alt first or unique body
      const altChoice = Math.random();
      if (altChoice < 0.35) {
        const alt =
          templates.lethal &&
          templates.lethal[Math.floor(Math.random() * templates.lethal.length)];
        candidate = typeof alt === "function" ? alt(ref) : alt || raw;
      } else if (altChoice < 0.7) {
        const alt =
          templates.brutal &&
          templates.brutal[Math.floor(Math.random() * templates.brutal.length)];
        candidate = typeof alt === "function" ? alt(ref) : alt || raw;
      } else {
        candidate = makeUniqueBody(raw, used);
      }
      // small mutation: attach multisyl internal line occasionally
      if (Math.random() < 0.12) {
        const addon = pick(templates.multisyl || []);
        if (addon) {
          const addonText = typeof addon === "function" ? addon(ref) : addon;
          candidate = `${candidate} — ${addonText}`;
        }
      }
    }

    if (!made) continue;

    // ---- swear injection (occasional but controllable) ----
    const canInsertSwear =
      out.length - lastSwearAt >= MIN_SWEAR_SPACING &&
      swearCount < MAX_SWEARS_PER_RUN &&
      (Math.random() < SWEAR_INSERT_PROB || swearMode === "force");
    if (
      canInsertSwear &&
      URDU_NORMALIZER &&
      Array.isArray(URDU_NORMALIZER.swearPool) &&
      URDU_NORMALIZER.swearPool.length
    ) {
      const swear = pick(URDU_NORMALIZER.swearPool);
      const insultRegex =
        /\b(clearance sale|used goods|proxy rapper|store-bought bars|bootleg|demo tape|copy-paste|fake|poser)\b/i;
      if (insultRegex.test(candidate)) {
        candidate = candidate.replace(insultRegex, swear);
      } else {
        const formats = [
          ` — ${swear}`,
          ` ( ${swear} )`,
          ` — ${swear}, checkmate`,
          ` — ${swear} — mic drop`,
        ];
        candidate = `${candidate}${pick(formats)}`;
      }
      lastSwearAt = out.length;
      swearCount++;
    }
    // ---- end swear injection ----

    // avoid exact duplicates
    if (used.includes(candidate)) {
      // try fallback variant
      candidate = makeUniqueBody(candidate, used);
    }

    // if still too similar, use lyrical fallback
    if (isTooSimilar(candidate, used, 0.6)) {
      const fallback = makeLyricalFallback(used, ref, swearMode);
      if (fallback && fallback.body) candidate = fallback.body;
    }

    if (!candidate || !candidate.trim()) continue;

    used.push(candidate);
    out.push({ body: candidate, at: 0 });
  }

  // fill if needed using lyrical fallback (no random-code tokens)
  while (out.length < maxLines) {
    const fallback = makeLyricalFallback(used, ref, "force");
    if (fallback && fallback.body) out.push(fallback);
    else break;
  }

  return out.slice(0, maxLines);
}
// ------------------------------------------------------------

// ---------------- Argument parsing helpers -------------------
function parseArguments(args) {
  let targetInput = args.join(" ").trim();
  let maxLines = 80;
  let delayMs = 8500;
  let intensity = "mixed";
  let swearMode = "normal";
  let forceBurst = false;

  const intensityMatch = targetInput.match(
    /intensity:(normal|hard|lethal|brutal|mixed|multisyl)/i,
  );
  if (intensityMatch) {
    intensity = intensityMatch[1].toLowerCase();
    targetInput = targetInput.replace(intensityMatch[0], "").trim();
  }

  const numericArgs = args.filter((arg) => /^\d+$/.test(arg));
  if (numericArgs.length > 0) {
    const firstNum = numericArgs[0];
    const idx = args.indexOf(firstNum);
    maxLines = Math.min(parseInt(firstNum, 10), 250);
    if (idx > 0) {
      targetInput = args.slice(0, idx).join(" ").trim();
    }
  }
  if (numericArgs.length > 1) {
    delayMs = Math.max(parseInt(numericArgs[1], 10), 4000);
  }

  const singleIntensity = args.find((a) =>
    /^(normal|hard|lethal|brutal|mixed|multisyl)$/i.test(a),
  );
  if (singleIntensity) intensity = singleIntensity.toLowerCase();

  if (args.find((a) => /^--swear$/i.test(a) || /^swear:force$/i.test(a))) {
    swearMode = "force";
  }

  if (args.find((a) => /^--burst$/i.test(a))) {
    forceBurst = true;
  }

  if (!targetInput) targetInput = null;

  return {
    targetInput,
    maxLines,
    delayMs,
    intensity,
    swearMode,
    forceBurst
  };
}

// ---------------- Target resolution helper -------------------
async function resolveTarget(api, event, targetInput, threadID) {
  let targetId = null;
  let targetName = null;

  if (!targetInput) {
    return { targetId, targetName };
  }

  try {
    const threadInfo = await new Promise((resolve) => {
      api.getThreadInfo(threadID, (err, info) => resolve(err ? null : info));
    });

    if (!threadInfo || !threadInfo.participantIDs) {
      return { targetId, targetName };
    }

    if (targetInput.toLowerCase() === "random") {
      const others = threadInfo.participantIDs.filter(
        (id) => id !== event.senderID,
      );

      if (others.length > 0) {
        const randomId = others[Math.floor(Math.random() * others.length)];
        const randomUser = threadInfo.userInfo
          ? threadInfo.userInfo.find((u) => String(u.id) === String(randomId))
          : null;

        targetId = randomId;
        targetName = randomUser?.name || "Koi Bhi";
      }
    } else {
      const needle = targetInput.toLowerCase().replace(/@/g, "");
      const targetUser = threadInfo.userInfo.find((user) => {
        const uname = (user.name || "").toLowerCase();
        return uname.includes(needle) || needle.includes(uname);
      });

      if (targetUser) {
        targetId = targetUser.id;
        targetName = targetUser.name;
      }
    }
  } catch (err) {
    console.error("Error resolving target:", err);
  }

  return { targetId, targetName };
}

// ---------------- Message sending helper -------------------
async function sendMessage(api, threadID, rawText, targetId, targetName) {
  const normalizedObj = URDU_NORMALIZER.normalize(rawText, {
    maxRepeat: 2,
    censorLevel: 0,
    mapRoman: true,
  });

  const normalizedText = normalizedObj?.text || rawText;

  if (targetId && targetName) {
    const tag = `@${targetName}`;
    const mention = { tag, id: targetId };
    const body = `${tag} ${normalizedText}`;

    try {
      await api.sendMessage({ body, mentions: [mention] }, threadID);
      return true;
    } catch (e) {
      console.error("Send with mention failed:", e);
      try {
        await api.sendMessage(normalizedText, threadID);
        return true;
      } catch (err) {
        console.error("Fallback send failed:", err);
        return false;
      }
    }
  } else {
    try {
      await api.sendMessage(normalizedText, threadID);
      return true;
    } catch (e) {
      console.error("Send without mention failed:", e);
      try {
        await api.sendMessage(rawText, threadID);
        return true;
      } catch (err) {
        console.error("Fallback send failed:", err);
        return false;
      }
    }
  }
}

// ---------------- main run (integrated) -------------------
module.exports.run = async function ({ api, args, event }) {
  const threadID = event.threadID;

  // Parse arguments
  const { 
    targetInput, 
    maxLines, 
    delayMs, 
    intensity, 
    swearMode, 
    forceBurst 
  } = parseArguments(args);

  // Resolve target
  const { targetId, targetName: parsedTargetName } = await resolveTarget(
    api, event, targetInput, threadID
  );

  // Get display names
  const { senderName, targetName: resolvedTargetName } =
    await resolveDisplayNames(api, event, event.senderID, targetId);

  const finalTargetName = parsedTargetName || resolvedTargetName;

  // Build messages
  let messages = [];
  try {
    messages = buildMessagePool({
      maxLines,
      intensity,
      ref: refBank,
      swearMode,
    });
  } catch (e) {
    console.error("Error building pool:", e);
    messages = buildMessagePool({
      maxLines: Math.min(maxLines, 40),
      intensity: "mixed",
      ref: refBank,
      swearMode,
    });
  }

  // allocate timing
  const start = Date.now();
  messages.forEach((m, i) => {
    let baseAt = i * delayMs;
    const isLethal =
      /mic drop|lethal|limited edition|warranty expired|quantum|diamond|micdrop|cancelled|refund|resale|expired|obituary|forensic|killer|kill|killer/i.test(
        m.body,
      );
    if (isLethal) baseAt = Math.max(0, baseAt - Math.floor(delayMs * 0.6));
    m.at = baseAt;
  });

  // Schedule sends — mention on every message by default
  const mentionEvery = true;
  for (const m of messages) {
    const delay = Math.max(0, m.at - (Date.now() - start));

    setTimeout(async () => {
      try {
        await sendMessage(
          api, 
          threadID, 
          m.body, 
          mentionEvery ? targetId : null, 
          mentionEvery ? finalTargetName : null
        );
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }, delay);
  }
};
// ------------------------------------------------------------

// --------------- exports for tuning/debug -------------------
module.exports._helpers = {
  pick,
  refBank,
  templates,
  tokenDice,
  isTooSimilar,
  makeUniqueBody,
  buildMessagePool,
  URDU_NORMALIZER,
  makeLyricalFallback,
  lyricalFallback,
  parseArguments,
  resolveTarget,
  sendMessage
};
// ------------------------------------------------------------