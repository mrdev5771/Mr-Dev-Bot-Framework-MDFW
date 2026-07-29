module.exports.config = {
  name: "warv4",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "MrDeveloper & Grok & ChatGPT",
  usePrefix: true,
  description:
    "Advanced rap-battle generator — multisyllabic rhyme chains, internal rhyme, double/triple entendres, 5 styles (eminem/royce/lupe/jcole/diss). Usage: warv4 [@user|random] [style] [maxLines] [delayMs]",
  commandCategory: "group",
  usages:
    "warv4 [optional: @username | random] [optional: style] [optional: maxLines] [optional: delayMs]",
  cooldowns: 5,
  dependencies: {},
};

// --- Helper: robust display-name resolution (safe/durable) ---
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
        resolve(err ? null : info)
      );
    });
  } catch (e) {
    // ignore
  }

  if (threadInfo?.userInfo && Array.isArray(threadInfo.userInfo)) {
    const senderData = threadInfo.userInfo.find(
      (u) => String(u.id) === String(senderId)
    );
    const targetData = threadInfo.userInfo.find(
      (u) => String(u.id) === String(targetId)
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
    } catch (e) {
      // ignore
    }
  }

  return {
    senderName: senderName || "You",
    targetName: targetName || "Random Fool",
  };
}

// --- Lyric Engine: lightweight phonetic-ish rhyme & template system ---
const seedBank = {
  eminem: [
    [
      "I’m spittin’ verbal gymnastics, surgical with syllables, clinical with decimals,",
      "Verbal arsonist, spark the cartilage, carve the cartilage — bars are my metallic bell,",
      "Rapid-fire, fabric tear, fabricate your fate, I lace the cadence with madness,",
      "Internal ricochet, sick with the syntax, flip the script, split the audience with madness,",
      "I’m the paradox in your paradox, I shock the clock, I lock the plot,",
      "Multisyllable missiles that whistle when I rip the top, then I drop the lot,",
      "Double-meaning loaded: bars — prison and measure; I measure your pressure, treasure your pressure,",
      "I’m the rap god’s echo with teeth that nettle, I wrestle your ledger, sever your measure,",
      "Chain the rhyme: devastation — salvation — I craft the station where haters decay,",
      "Flow like a fissure through fissile diction, fission the system and watch it flay,",
      "My tongue’s a blade, my cadence raid — I grade your grade and negate your fame,",
      "Triples tucked in triple entendre trunks, every trunk a function to shatter your name,",
      "I’m the hurricane’s cousin, spit the season, force the reason, tear the ceiling,",
      "You’re a footnote in my thesis — weak thesis — I bleed the thesis, leave you reeling,",
      "Payoff: I run the ring while you cling — my sting out-sings your entire clique,",
      "I reign in syllables and sin and synonyms — your spin’s thin; my win sticks.",
    ],
    [
      "I fracture grammar like glass, scatter shards across the map, class dismissed,",
      "Tongue-twisted technician, stitch syllables into stitches — every phrase a fist,",
      "Rapid rabbit-rap, habit of habitless habit-attack — I break your habit, skip a beat,",
      "I lace lexical landmines — step light, get lit; your end’s a deleted tweet,",
      "Multisyllable massacre: catastrophe, apostrophe, my prophecy pressurizes your prophecy,",
      "I decorate devastation with diction, diction-sculpted, picture perfect atrocity,",
      "Internal ricochet, verbs curve, verbs swerve, I serve verbs with surgical nerve,",
      "The simile’s a missile, I hurl it until your credibility deserts your verve,",
      "Layers stacked: I mean the street and the suit — both take beatings when I speak,",
      "My metaphors are mortgages — you owe the truth, foreclosure on the weak,",
      "I box the clock — time’s my opponent — knock the tick from ticking,",
      "Triple-entendre tucked: “beat” is your heart, your loss, and the tune I’m picking,",
      "I stitch a sentence like circuitry — shock the system, watch the lights flicker,",
      "You’re a footnote in my lecture; I’m the professor, the pressure, the sticker,",
      "Final swing: I reign in rhyme while you wade shallow in shallow pools,",
      "I turn phrases to razors — blade of cadence carves your rules.",
    ],
    [
      "Verbal volley, volley of vowels, I tower till towers topple,",
      "My meter’s a meteor, I impact with syllable shock and socio-political models,",
      "I splice consonants like circuits, spark the syntax till the system throttles,",
      "I thread triple entendres through tremors — your tremble, my tremor bottles,",
      "I harvest headlines with handshakes — handshake’s a pact and a trap,",
      "I lace legal and lethal — legalese with a leave-it-to-the-clap,",
      "Internal rhymes ricochet in corridors — corridor of commas and cages,",
      "I pen prison and podium — podium praises while prison pages,",
      "I stitch a seismograph of sound — every bar records the quake,",
      "Your career’s a cracked coin; my currency’s the commerce I make,",
      "Triple-layered puns populate the paragraph — plural purposes per line,",
      "I pivot paradigms, pry apart lies and reframe your design,",
      "My cadence carves canyons; your cantons collapse into comments,",
      "I weaponize the lexicon — each letter’s a ledger of opponents,",
      "Payoff: I’m the echo in the empire, the ember in the era — remember the name,",
      "I leave linguistic landmarks — my land’s the language, I claim the claim.",
    ],
  ],
  royce: [
    [
      "Heavy with the hammer, I batter the banner, matter shatter, scatter your chatter,",
      "Punchline pivot, pivot the scabbard — I carve you shallow like carvings later,",
      "I compute the coup, execute the route, recruit the truth to boot the fraud,",
      "Sharp in the syntax, tight with the timing, I bite, then I light up your façade,",
      "Smith & Wesson wordplay — I press the session, lesson your aggression,",
      "Calculated bar-by-bar, barbed-wire wit, I harvest your confession,",
      "Multisyllable matrix, I lace the tests; test the best and arrest their breath,",
      "I vest in evidence — your essence’s less, confess, then exit the set,",
      "Metaphor: fortress of language — I storm the gate; your bait’s a paper plate,",
      "I crown the crownless, drown the soundless, pound the ground with sound so great,",
      "Quick left: you’re sketchy, stretchy — your rep is sketchy, peanut-shell petty,",
      "I’m heavy like ledgers, ledger the letter — better bet on the vet, get ready,",
      "I peel layers like onions — punchlines sting, your front-line flinches, your bluff thins,",
      "Money in my mouth is music — I mouth the margins while your margin’s thin,",
      "Close: I’m the culprit in the court of cadence — judge the case, sentence your taste,",
      "Verdict: your verse’s verdict — vanished; I vanish in verve, leave you erased.",
    ],
    [
      "I clock verbs and break verbs — action’s currency, spend your credit,",
      "Pocket full of paybacks, I’m exact with the math, check your debit,",
      "My aim is clinical; syllables surgical — I stitch wounds with wordplay,",
      "Precision punchlines land like brass — heavy, rapid, pay the tollway,",
      "I lace the lexicon with lead — every line’s a loaded ledger,",
      "I harvest headlines: you headline flops, my headlines sever fetters,",
      "The cadence’s calibrated — step with care, I calibrate the trap,",
      "I flip the format: from meek to menace in the cadence of a clap,",
      "Industry infantry — I storm the battlements; your camp collapses slow,",
      "I catalog craters where your career once tried to grow,",
      "Short and savage: you blink, you sink — market crash in your camp,",
      "I auction your aura, buy the silence after the amp,",
      "The metaphor’s a hammer; I wreck what’s weak, salvage what’s true,",
      "I bet on myself, fold you under pressure — curtain call, cue,",
      "Final tally: I’m heavyweight in verbs, you’re off-balance in nouns,",
      "Verdict: my lines litigate your lies, I sentence your sound.",
    ],
    [
      "Brass knuckles for syllables — I clench the consonants and deliver,",
      "I run audits on your aura, find flaws where your fans shiver,",
      "Punchline ledger balanced — credit my craft, debit your bluff,",
      "I mine metaphors like minerals — heavy metal rhymes, call the bluff,",
      "My timing’s an anvil; I hammer verses into ironclad bars,",
      "I measure momentum — your moment’s a mirage; I map the scars,",
      "I flip cheap fame into furnace fuel — your flame’s forfeit, mine’s forged,",
      "I sketch scenarios: you stumble, I stand stoic, script sourced,",
      "The cadence is currency; I spend it on sentences that sting,",
      "I’m the veteran vetting vendettas, vet the vet and watch the ring,",
      "Metaphor: I’m a locksmith — I pick apart locks of your lines,",
      "I field the fallout, harvest the hush — your hush becomes my signs,",
      "Micro-rhyme mechanics, macro impact — I tilt the battlefield,",
      "I fold fury into finesse — finesse your flaunt until it yields,",
      "Payoff: I’m the calibrator — check the gauge; your gauge reads nil,",
      "I collect echoes of your exit — claim the mic, claim the kill.",
    ],
  ],
  lupe: [
    [
      "Walk the mural corridor, corridor of mirrors — every mirror a variant of error,",
      "I scatter syllables like constellations, map the nation of notions, narrate terror,",
      "Each line a hallway, each hallway a chapel of maps and maps of chapel,",
      "My metaphors stack like bricks — brick by brick I build a chapel of grapples,",
      "I paint history in letters, letters are ladders that tether old debts to new dawns,",
      "I stitch gospel with rust — dust to gold; from rust comes plot that moves pawns,",
      "Double-read: “flow” is finance and river — I ferry fortune, bury false prophets,",
      "Stream of consciousness; rhyme is the reef: reef a refuge, reef robs the profits,",
      "The mural speaks in margins — margins that bleed into margins that feed the meaning,",
      "I fold time like origami, crease the present into futures that keep convening,",
      "Polysyllabic bridges bent into similes that suture wound to wonder,",
      "My diction is a doctor, stitches into verse — stitch the victim to thunder,",
      "Contextual: cityscapes breathe, the subway of syllables carries the sermon,",
      "Triples: “save / savor / savior” — layered salvation in flavors of sermon,",
      "Payoff: I write a map on your back: follow the ink, learn where you lack,",
      "The mural is a mirror and a roadmap; read once, you see few; read twice, you track.",
    ],
    [
      "I map out a metropolis in a paragraph, avenues of adjectives align,",
      "Each block a stanza — brick by brick I bind the past to future time,",
      "My mural breathes in margins; marginalia narrate the city’s hymn,",
      "I stitch scripture into subway maps — each stop a sermon, each sermon’s slim,",
      "I fold whole histories into half-lines and watch the halves reconstitute,",
      "Metaphors multiply like storefronts: every sign hides a substitute,",
      "The double meaning hums like an electric cable beneath the street,",
      "Words flicker neon: commerce and conscience collide where merchants meet,",
      "I pour oceans in alleys; tide of thought floods basements of belief,",
      "Layered similes salvage truth from rubble — thread a needle through grief,",
      "Linguistic architecture: vaults of vowels, pillars propping paradoxes,",
      "I plant phrases like trees — shade for scholars, fruit for fledgling prophets,",
      "The mural’s margin whispers: read slow — the city speaks in echoes,",
      "Triples stack like apartments: door, floor, stair — each a different echo,",
      "Payoff: I’ve painted a map so thick with meaning you can’t circumnavigate,",
      "And if you try, you’ll find new passages — this rhyme’s a living gate.",
    ],
    [
      "I fold continents into couplets, continents collapse into couplets of thought,",
      "My lines are laden lighthouses — guide the lost while listing the cost,",
      "I thread history through hyphens — hyphenated hopes, halved and whole,",
      "Metaphor masonry — I mortar meanings, anchor the arch of the soul,",
      "I plant verbs like vines; they climb the columns of culture and climb,",
      "My lyricism is a ledger where sunlight and sorrow both rhyme,",
      "Double read: ‘bank’ is river and vault — I bank on the current and coin,",
      "I choreograph chaos into chorus; every chorus a classroom, every class a coin,",
      "The mural mutates with each mouth — you speak, it rearranges maps,",
      "I stitch subway sermons into skylines; skylines sing in scraps,",
      "Triples buried in basements: bone, baton, backbone — each lifts the bone,",
      "I fold verse into vessel, vessel into voice — voyage the known,",
      "Payoff: follow the filament — each thread a threshold that thickens,",
      "My mural’s a memory bank — withdraw meaning where the world sickens,",
      "Close: I leave passages open — the reader completes the work,",
      "This verse is an invitation: enter the mural, roam the murk.",
    ],
  ],
  diss: [
    [
      "You parade like royalty but your crown’s cardboard — fold it, cheap, counterfeit, and creased,",
      "I flip your highlight reel to footage of you panic, footage of you fleeing the least,",
      "Your network’s a ghost town — echoes of clout that nobody cashes,",
      "You talk about numbers; I audit your ledger — all fiction, all ashes,",
      "I found your weak link and I pulled it — brace for the collapse you staged,",
      "Your flex is rented muscle — repossessed the first month you engaged,",
      "I file the evidence: receipts for your lies — case closed, public record,",
      "Your voice is thin as tissue over thunder; I rip it until the truth’s uncovered,",
      "You internet-warrior with keyboard courage and coward credit,",
      "I’m live artillery — your sound’s a hobby band, my roar’s a medic,",
      "Punchline: I trade your vendetta for vendor receipts — you’re bankrupt in bars,",
      "You’re background noise to my broadcast; I’m prime-time, I scar,",
      "I frame your failures in trophies — hollow, tarnished, cracked at the seam,",
      "I stitch your image into a cautionary tale — watch the stitches gleam,",
      "Final blow: I’m the headline; you’re the footnote someone deletes,",
      "Verdict: I spit evidence and execute; your legacy concedes.",
    ],
    [
      "You build sandcastles online — tide hits, flood takes the throne,",
      "I map the erosion: weak foundations, borrowed stones, brittle bone,",
      "Your crew is paper armor — glitter that folds in the rain,",
      "I rain on that parade until the confetti becomes your shame,",
      "You sell illusions in a booth — I’m the inspector with a torch,",
      "I flip the switch; smoke reveals seams; your seamstress flees the porch,",
      "Internal: I rhyme 'fraud' with 'applaud' to show how applause is owed,",
      "But real praise is scarce; I withhold it while you implode,",
      "I double-clinch the joke: your best shot’s a starch that rips in the wash,",
      "I counterpunch with verses — left hook of verbs, uppercut of the hush,",
      "Vocabulary is my arsenal; I aim at your brand, dismantle the spokes,",
      "Your fans fold like paper fans in a storm — no shelter, no cloak,",
      "My cadence is a court order: show receipts or leave the stage,",
      "Your name’s a footnote in my manifesto — I rewrite your page,",
      "Payoff: you begged for smoke — I handed a forest; now you choke,",
      "Close: I exit, mic drop; your echo’s the only thing left to smoke.",
    ],
    [
      "Multisyllable massacre: I lace the phrase and spray the phrase like flame,",
      "Internal ricochet — syllables rattle while your similes stay the same,",
      "I tax your verbs and repossess your nouns; levy on that fake claim,",
      "You counterfeit content, I certify the truth — stamp your brand in shame,",
      "I pivot patterns, twist accents; your flow’s a film stuck on one frame,",
      "My meter’s a metronome that laughs while your watch loses the game,",
      "Wordplay surgeon: I dissect your hooks until the hooks concede,",
      "I harvest your punchlines early — you plant seeds, I reap the weed,",
      "Quick quip: you clap for applause, I clap for autopsy — examine the body,",
      "I flip the narrative and sign the verdict — guilty of being shoddy,",
      "I’m the editor of endings; I cut scenes that glorify your bluff,",
      "Your credit’s expired; I swipe your card and leave your accounts rough,",
      "Internal rhyme: mind grind, find flinty lines that fire and fall,",
      "I fold your fortress into paper — chimney smoke is all you call,",
      "Payoff line: I’m the thunder after your lightning — bigger, meaner, colder,",
      "I close the book and archive your name under ‘should’ve been bolder.’",
    ],
    [
      "Remember when you said you’d be different? I archived that promise, mute,",
      "Now your inbox is a museum of drafts — drafts that never grew into truth,",
      "I scanned your CV of boasts — expiration date: yesterday’s paper, unread,",
      "Your followers are seasonal — petals fall once complications spread,",
      "I expose the template: recycled lines, recycled lies, recycled applause,",
      "I swing the spotlight; your cracks glitter — everyone sees the flaws,",
      "I roast with classifieds — e.g., FOR SALE: confidence, slightly used,",
      "Internal: I rhyme ‘used’ with ‘abused’ to show how your posture’s bruised,",
      "Your threats are gentle breezes — I’m a gale that rips off banners,",
      "I sign receipts for every time you promised war then posted canned answers,",
      "I inventory the absence — what you didn’t do weighs more than what you did,",
      "My mic is a magnifier; under it your fabrications look thin and slid,",
      "I punch in the margins: your margins never paid the dues, just the fees,",
      "You’re a cameo in my history — a clip I play for laughs and jeers,",
      "Payoff: I’m the wake-up call that breaks your dream into shards,",
      "Final: clean sweep — I erase the chalk lines and draw my guards.",
    ],
  ],

  jcole: [
    [
      "Came up with a pocket full of pennies and a head full of questions,",
      "Mama worked two jobs, faith at the stove, patience in the syrup, surely,",
      "I learned measurement: time spent, time saved — currency not always counted,",
      "I trade in small truths: chess moves in life, not flash — checkmate’s mounted,",
      "My bars fold into the next like pages in a ledger of days,",
      "We paint porch dreams in chalk but live in ink — permanent ways,",
      "I jab the fake flex: it’s loud but hollow — hollow is easy to hear,",
      "I fold the child in me with the man — stitch the seam with care, not fear,",
      "The story is honest: lost friends, second chances, receipts tucked in wallets,",
      "I line my lines with lessons: guard your gifts, feed your talents,",
      "Double-mean: “check” — look and payment — verify both before you spend,",
      "I pen the past in present tense — a living memory that mends,",
      "The cadence’s calm but the message cuts: steady wins the race,",
      "I fold glory into grit; grit into grace — keep the pace, embrace,",
      "Finale: I hand you the map I made from my mistakes — read every fold,",
      "Truth’s the currency I invest in; dividends are quiet, but bold.",
    ],
    [
      "I flip the script back to the block — block parties, block problems, broken,",
      "I mentor the mirror I used to avoid — now I gaze, I’m outspoken,",
      "I fold redemption into rhymes — redemption’s not free, you pay dues,",
      "Lessons stacked like ledgers — every choice is a line you can’t refuse,",
      "Love is a ledger; count deposits and withdraws with care,",
      "I teach patience through practice: practice the prayer, prepare,",
      "Double-mean: ‘score’ — points and debts — settle both before night,",
      "I map the margin between hunger and plenty, shade and light,",
      "The verse’s arc is simple: rise, falter, rebuild with a plan,",
      "I stitch apologies into action; action becomes the man,",
      "Micro-histories merge into memoirs — read the margins for truth,",
      "I mouth small revolutions, change daily rhythms in youth,",
      "Payoff: the quiet accumulation — patience, practice, the prize,",
      "I hand you a path paved with real work; walk it, revise,",
      "Close: wisdom’s not loud — it hums; put your ear to the ground,",
      "And you’ll hear the future humming back — follow that sound.",
    ],
  ],
};

const LyricEngine = (function () {
  // small vowel clusters & consonant tail extractor to approximate rhyme keys
  function rhymeKeyFor(word) {
    if (!word) return "x";
    word = String(word)
      .toLowerCase()
      .replace(/[^a-z']/g, "");
    // try to extract last vowel + consonants (naive)
    const m = word.match(/([aeiouy][a-z']{0,4})$/);
    if (m) return m[1];
    // fallback to last 3 letters
    return word.slice(-3);
  }

  // expanded banks to seed imagery and polysemy for more variety
  const rhymeBanks = {
    1: ["ight", "ightness", "ignite", "fight", "light", "night", "sight"],
    2: ["own", "crown", "throwdown", "town", "down", "clown", "frown"],
    3: ["ation", "nation", "devastation", "salvation", "station", "inflation"],
    4: ["ash", "crash", "smash", "trash", "flash", "slash", "clash"],
    5: ["end", "bend", "send", "trend", "friend", "defend", "pretend"],
    6: ["ire", "fire", "wire", "tire", "mire", "spire", "liar"],
    7: ["ock", "clock", "shock", "lock", "rock", "knock", "block"],
    8: ["ade", "blade", "shade", "fade", "trade", "invade", "cascade"],
  };

  const polysemy = {
    bars: ["lyrics", "prison bars", "bar (measure)", "gold bars"],
    flow: ["rap flow", "cash flow", "water flow", "lava flow"],
    beat: ["drum beat", "you get beat (lose)", "beat as in deal", "heart beat"],
    crown: ["royalty", "trophy", "knock to the head", "dental crown"],
    check: ["verify", "payment", "chess move", "restrain"],
    bank: ["river bank", "money bank", "rely on", "basketball shot"],
    score: ["points", "music", "settle debts", "scratch"],
  };

  const imagery = {
    weapons: ["razor", "spear", "blades", "guillotine", "dagger", "cannon", "arrow", "bomb"],
    nature: ["storm", "tsunami", "hurricane", "volcano", "earthquake", "tornado", "avalanche", "flood"],
    architecture: ["fortress", "labyrinth", "pillars", "throne", "tower", "bridge", "vault", "castle"],
    myth: ["leviathan", "phoenix", "hydra", "titan", "minotaur", "cyclops", "siren", "griffin"],
    tech: ["circuit", "virus", "firewall", "hacker", "algorithm", "matrix", "code", "glitch"],
    street: ["alley", "block", "corner", "porch", "ledger", "hustle", "grind", "trap"],
  };

  // expanded templates tuned for styles, added diss
  const templates = {
    eminem: [
      "{lead} {internal}, {internal2} — {tail} {polyHint}",
      "{internal}, {internal2}, then i {action} your {target}; pocket change for my {met1}.",
      "{lead} like a {met1}, {internal} — i light the {met2} and ignite the night.",
      "Spittin' {internal} chains, {action} the game, your name's a stain I {action} with disdain.",
      "Internal rhyme rebound, sound profound, I hound the ground till your crown's unfound.",
      "Multisyllable slaughter, water to mortar, I order the border and shorten your quarter.",
    ],
    royce: [
      "{lead}, hard like {met1}; punchline pivot, leave your {target} all twisted.",
      "I {action} the scene, clean and mean; syllables lean like a machine.",
      "Calculated strike, mic like a spike, I hike the price on your fake hype.",
      "Punchline precision, decision incision, your vision's a prison I mission to fission.",
      "Heavy hitter, bitter quitter, I twitter your litter and glitter the splitter.",
      "Audit your flow, low and slow, I tow the show and overthrow the pro.",
    ],
    lupe: [
      "{internal} — mural-length metaphors, corridor of thought; I pour a war into the verse.",
      "Stream the mural: {internal}, {internal2}, {met1} becomes the map.",
      "Fold the city into syntax, tax the abstract, extract the fact from the act.",
      "Paint the paradox, unlock the locks, I stock the docks with philosophical rocks.",
      "Layer the ledger with legend, bend the trend, send the end to amend.",
      "Mural mutates, debates the fates, I rate the gates and elevate the states.",
    ],
    jcole: [
      "{lead} from the heart; {internal} — lessons in the bars, not just the art.",
      "I tell a story: {internal}, payoff: {tail}.",
      "From the block to the top, stop and cop the wisdom drop.",
      "Introspective flow, grow from the low, show what you know before you go.",
      "Lessons in layers, players to prayers, I stare at the stairs and repair the tears.",
      "Quiet grind, mind aligned, find the sign in the design.",
    ],
    diss: [
      "{lead} your crown, clown around, I drown your sound in the underground.",
      "Expose the fake, break the stake, your mistake's a lake I navigate.",
      "Receipts on deck, wreck your respect, I check and eject your defect.",
      "Your flex is frail, tale stale, I nail the fail and set sail.",
      "Diss dissection, reflection rejection, your section's infection I section.",
      "Bankrupt bars, scars from afar, I star in the war you ignore.",
    ],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function safeWord(s) {
    return String(s || "")
      .replace(/[\n\r]/g, " ")
      .trim();
  }

  // very small banned words filter (non-exhaustive) to avoid slurs; extend as needed
  const bannedPattern = /\b(nigger|faggot|slur1|slur2)\b/i; // replace slur1/2 with real banned words if you expand
  function containsBanned(text) {
    return bannedPattern.test(text || "");
  }

  // simple Fisher–Yates shuffle
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // build a single line with more variety
  function makeLine({ style = "eminem", rhymeSeed = null, targetName = null }) {
    const tpl = pick(templates[style] || templates.eminem);
    const lead = pick([
      "I’m spittin'",
      "Watch me",
      "I carve",
      "I torch",
      "Listen up",
      "I dismantle",
      "Spittin' fire",
      "I conquer",
      "Verbal assault",
      "I dominate",
    ]);
    const internal = pick([
      "multisyllabic manic",
      "verbal gymnastics",
      "syntax automatic",
      "lyric acrobatics",
      "rhyme chains insane",
      "wordplay whirlwind",
      "cadence chaotic",
      "flow ferocious",
      "bars ballistic",
      "punchlines precise",
    ]);
    const internal2 = pick([
      "quick split",
      "slick spit",
      "flip script",
      "split wit",
      "twist gist",
      "shift rift",
      "hit quit",
      "clip tip",
      "grip slip",
      "dip rip",
    ]);
    const action = pick([
      "crush",
      "uncrown",
      "eviscerate",
      "slice",
      "shatter",
      "demolish",
      "obliterate",
      "decimate",
      "annihilate",
      "eradicate",
    ]);
    const met1 = pick(
      imagery.nature.concat(imagery.myth, imagery.weapons, imagery.tech, imagery.street)
    );
    const met2 = pick(
      imagery.architecture.concat(imagery.myth, imagery.nature, imagery.tech)
    );

    // choose rhyme tail — if rhymeSeed provided, sometimes mutate it slightly to avoid identical tails
    let tail;
    if (rhymeSeed && Math.random() < 0.85) {
      // small chance to slightly vary tail (append a small suffix) for freshness
      tail =
        rhymeSeed + (Math.random() < 0.3 ? pick(["ness", "ing", "ed", "er", "s"]) : "");
    } else {
      const bankKey = Math.floor(Math.random() * Object.keys(rhymeBanks).length) + 1;
      tail = rhymeSeed ? rhymeSeed : pick(rhymeBanks[bankKey]);
    }

    let polyKey = pick(Object.keys(polysemy));
    let polyHint = polyKey + ` (${pick(polysemy[polyKey])})`; // hint at double meaning

    let target = targetName ? targetName : "random fool";

    let line = tpl
      .replace(/{lead}/g, lead)
      .replace(/{internal}/g, internal)
      .replace(/{internal2}/g, internal2)
      .replace(/{action}/g, action)
      .replace(/{met1}/g, met1)
      .replace(/{met2}/g, met2)
      .replace(/{tail}/g, tail)
      .replace(/{polyHint}/g, `— call it ${polyHint}`)
      .replace(/{target}/g, target);

    line = safeWord(line);
    if (containsBanned(line)) line = "(content removed for safety)";
    return line;
  }

  // makeVerse: pool all seeds for style, uniquify, shuffle, sample without replacement; generate unique if needed
  function makeVerse({ lines = 8, style = "eminem", targetName = null }) {
    const uniq = new Set();
    const out = [];

    // pool all lines from all verses in the bank for more variety
    try {
      const bank = seedBank[style];
      if (bank && bank.length && Math.random() < 0.7) { // increased chance to use seeds
        let allLines = [];
        bank.forEach(verse => {
          allLines = allLines.concat(verse);
        });
        // remove duplicates in pool
        allLines = [...new Set(allLines)];
        // shuffle the pool
        const shuffled = shuffle(allLines);
        // take up to 'lines' unique items
        for (let i = 0; i < Math.min(lines, shuffled.length); i++) {
          let line = shuffled[i] || "";
          line = line.replace(/\{target\}/g, targetName || "random fool");
          if (!uniq.has(line)) {
            uniq.add(line);
            out.push(line);
          }
        }
      }
    } catch (e) {
      // fall back to generated verse on any error
    }

    // If we didn't produce enough from curated seed, generate fresh lines with uniqueness checks
    const maxAttemptsPerLine = 12; // increased attempts
    const usedRhymeSeeds = new Set(); // track used rhyme seeds to reduce repetition
    while (out.length < lines) {
      let attempt = 0;
      let candidate = null;
      let rhymeSeed = pick(rhymeBanks[Math.floor(Math.random() * Object.keys(rhymeBanks).length) + 1]);
      while (usedRhymeSeeds.has(rhymeSeed) && usedRhymeSeeds.size < Object.keys(rhymeBanks).reduce((acc, k) => acc + rhymeBanks[k].length, 0)) {
        rhymeSeed = pick(rhymeBanks[Math.floor(Math.random() * Object.keys(rhymeBanks).length) + 1]);
      }
      usedRhymeSeeds.add(rhymeSeed);

      while (attempt < maxAttemptsPerLine) {
        // pass rhymeSeed for density, but vary more
        candidate = makeLine({
          style,
          rhymeSeed: style === "eminem" || style === "diss" ? rhymeSeed : null,
          targetName,
        });
        if (!uniq.has(candidate)) break;
        attempt++;
      }
      // If attempts exhausted and duplicate, mutate
      if (uniq.has(candidate) && attempt >= maxAttemptsPerLine) {
        candidate = candidate + pick([" — twisted", " — reloaded", " — flipped", " — remixed", " — upgraded"]);
      }
      uniq.add(candidate);
      out.push(candidate);
    }

    return out;
  }

  function makeSong({ targetName = null, style = "eminem" }) {
    return {
      chorus: [
        `I reign while you remain, no crown, just a throwdown.`,
        `My flow floods your town, I ignite the night.`,
      ],
      verse1: makeVerse({ lines: 8, style, targetName }),
      verse2: makeVerse({ lines: 8, style, targetName }),
    };
  }

  return {
    makeLine,
    makeVerse,
    makeSong,
    rhymeKeyFor,
    polysemy,
  };
})();

// --- Module run: glue to bot API ---
module.exports.run = async function ({ api, args, event }) {
  const threadID = event.threadID;
  let targetId = null;
  let targetName = null;
  let style = "eminem"; // default
  let maxLines = 12;
  let delayMs = 9000; // default delay to be FB-friendly

  // parse args: [target|random] [style] [maxLines] [delayMs]
  if (args.length > 0) {
    const all = args.join(" ");
    // find numeric args
    const numericArgs = args.filter((a) => !isNaN(a));
    if (numericArgs.length > 0) {
      maxLines = Math.min(120, parseInt(numericArgs[0]));
    }
    if (numericArgs.length > 1) {
      delayMs = Math.max(4000, parseInt(numericArgs[1]));
    }

    // style detection (one of eminem/royce/lupe/jcole/diss)
    const styles = ["eminem", "royce", "lupe", "jcole", "diss"];
    for (const s of styles) if (all.toLowerCase().includes(s)) style = s;

    // target handling
    const styleIndex = args.findIndex((a) => styles.includes(a.toLowerCase()));
    const numStart = args.findIndex((a) => !isNaN(a));
    const targetEnd = Math.min(
      styleIndex >= 0 ? styleIndex : Infinity,
      numStart >= 0 ? numStart : Infinity
    );
    const userInput = args.slice(0, targetEnd).join(" ").trim();

    if (userInput.toLowerCase() === "random") {
      try {
        const threadInfo = await new Promise((resolve) => {
          api.getThreadInfo(threadID, (err, info) =>
            resolve(err ? null : info)
          );
        });
        if (threadInfo?.participantIDs) {
          const others = threadInfo.participantIDs.filter(
            (id) => id !== event.senderID
          );
          if (others.length) {
            const randomId = others[Math.floor(Math.random() * others.length)];
            targetId = randomId;
            // try to resolve name from userInfo
            const randomUser = threadInfo.userInfo?.find(
              (u) => String(u.id) === String(randomId)
            );
            targetName = randomUser?.name || `User${randomId}`;
          }
        }
      } catch (e) {
        // ignore
      }
    } else if (userInput) {
      // try to find user by name from thread
      try {
        const threadInfo = await new Promise((resolve) => {
          api.getThreadInfo(threadID, (err, info) =>
            resolve(err ? null : info)
          );
        });
        if (threadInfo?.userInfo) {
          const targetUser = threadInfo.userInfo.find((u) =>
            u.name
              .toLowerCase()
              .includes(userInput.replace(/@/g, "").toLowerCase())
          );
          if (targetUser) {
            targetId = targetUser.id;
            targetName = targetUser.name;
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // final name resolution
  const resolved = await resolveDisplayNames(
    api,
    event,
    event.senderID,
    targetId
  );
  const senderName = resolved.senderName;
  targetName = targetName || resolved.targetName;

  // generate bars
  const linesToGenerate = Math.max(1, Math.min(120, maxLines));
  let generated = [];

  // pick generation strategy by style
  if (style === "lupe") {
    // longer mural-like single-verse generation
    generated = LyricEngine.makeVerse({
      lines: Math.min(32, linesToGenerate),
      style,
      targetName,
    });
  } else {
    // others: standard verse
    generated = LyricEngine.makeVerse({
      lines: linesToGenerate,
      style,
      targetName,
    });
  }

  // prepare messages array with mention injection when possible
  const messages = generated.map((text) => {
    // attach mention only to some lines to avoid spam (e.g., every 3-5 lines)
    return {
      body: text,
      mention: targetId && Math.random() < 0.25 ? { id: targetId, name: targetName } : null, // reduced frequency
    };
  });

  // sequential send with delayMs spacing
  const startAt = Date.now();
  const sendOne = async (msgObj) => {
    try {
      if (msgObj.mention) {
        const mention = {
          tag: `@${msgObj.mention.name}`,
          id: msgObj.mention.id,
        };
        await api.sendMessage(
          {
            body: `@${msgObj.mention.name} ${msgObj.body}`,
            mentions: [mention],
          },
          threadID
        );
      } else {
        await api.sendMessage(msgObj.body, threadID);
      }
    } catch (err) {
      // degrade gracefully
      try {
        await api.sendMessage(msgObj.body, threadID);
      } catch (e) {
        // ignore
      }
    }
  };

  for (let i = 0; i < messages.length; i++) {
    const delay = Math.max(0, i * delayMs - (Date.now() - startAt));
    setTimeout(() => sendOne(messages[i]), delay);
  }
};