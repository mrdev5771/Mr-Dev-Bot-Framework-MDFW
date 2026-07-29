module.exports.config = {
  name: "warv5",
  version: "1.0.4", // Updated version for even hotter disses
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
    // Previous verses remain, adding new ones inspired by real Eminem disses: brutal, personal, multisyllabic attacks like in Killshot, Nail in the Coffin
    [
      "I’m the rap surgeon, emergin' with urgency, purgin' your version of verses with no mercy,",
      "Multisyllable missiles: precision incision, I vision your fission and leave you in derision,",
      "{target}, you're a footnote in my scripture, picture your pitcher gettin' cracked like a fixture,",
      "Internal inferno: burnin' your earnin', turnin' your learnin' to yearnin' for curtains,",
      "Double entendre loaded: 'bars' mean prison and measures, I treasure your pressure, measure your lesser,",
      "I’m the hurricane harvester, harvest your bluster, cluster your muster and bust ya like cluster,",
      "You claim the throne but your crown's counterfeit, I counterfeit your fit and leave you in deficit,",
      "Triple threat: threat to your rep, rep your debt, debt to the set — I collect with no regret,",
      "Chain reaction: action fraction, traction attraction — I subtract your faction with satisfaction,",
      "Your flow's a trickle, mine's a tidal wave tidal, idle your idol, I sidle and bridle your bridle,",
      "I dissect your dialect, direct your defect, eject your project — you're wrecked, no respect,",
      "Punchline payload: explode your abode, reload and decode your mode till you're overrode,",
      "I’m the paradox predator, editor of your creditor — credit your editor, but you're the debtor,",
      "Your career's a carcass, I carve it with sharpness, harness the darkness and park it in starkness,",
      "Final fatality: reality duality — I duality your duality and leave you in totality,",
      "I reign supreme, dream team extreme — {target}, you're just a meme in my scheme.",
    ],
    [
      "Verbal venom injected, detected your defected, ejected and neglected — you're infected,",
      "Rapid rabbit-hole ravage, savage your baggage, ravage the average and manage the damage,",
      "I flip the script cryptic, triptych your gimmick, mimic your limbic and limb it with cynic,",
      "Multisyllable murder: herder of words, stir the absurd till your herd's deterred,",
      "Internal implosion: erosion of notion, commotion in ocean — I potion your devotion,",
      "{target}, your bars are borrowed, sorrowed and hollowed — I followed and swallowed your model,",
      "Double meaning menace: 'beat' your heart and your loss, I toss the dross and emboss the boss,",
      "I shatter your shatter, matter your patter, flatter then batter — ladder to scatter,",
      "Triple entendre tucked: 'crown' your head, your fall, and the jewel I haul,",
      "Chain the pain: disdain in the vein, train to detain — I reign in the rain,",
      "Your legacy's leggy but beggy, I peg it and egg it till it's reggy and segued,",
      "I calibrate the hate, fabricate the gate — wait for your fate, it's late but innate,",
      "Punch like a piston, listen to the friction — diction addiction, your conviction's fiction,",
      "I’m the echo of excellence, relevance in elegance — {target}, your elegance is negligence,",
      "Final swing: I sting like a king, bring the ring — your thing's a fling, I sing the zing.",
      "{target}, bow down or drown — I'm the crown in this town.",
    ],
    [
      "Syllable sniper, hyper and riper — I viper your cipher and hyper the hyper,",
      "Internal ignition: position your mission, fission the vision — I condition the fission,",
      "Multisyllable mayhem: stem from the gem, hem your condemn — I condemn your stem,",
      "{target}, you're a puppet on strings, I bring the bling and sting your wing,",
      "Double read: 'flow' your cash and your rap — I trap the gap and snap the map,",
      "I orchestrate the hate, dictate the rate — late to the gate, I ate your plate,",
      "Triple layered: 'check' your move, your pay, and your wreck — I deck the spec,",
      "Chain devastation: elevation in station — I station your nation in degradation,",
      "Your throne's a loan, moan in the zone — I own the tone and hone the bone,",
      "I eviscerate the fake, bake your stake — quake in the wake, I take the cake,",
      "Punchline precision: decision incision, vision collision — I mission the fission,",
      "I’m the titan of tighten, brighten the frighten — lighten your lighten and heighten the heighten,",
      "{target}, your disses miss, bliss in the abyss — I dismiss your kiss with a twist,",
      "Final fatality: brutality in duality — actuality your fallacy, I rally the tally.",
      "I leave you in debris, free from your plea — see the degree of my spree.",
      "{target}, it's over — clover in rover, I dover your clover.",
    ],
    [
      "I’m the battle rap beast, feast on your least — release the cease and increase the crease,",
      "{target}, your skills are stale, pale and frail — I hail the nail and unveil the veil,",
      "Multisyllable massacre: plaster your master, faster disaster — I caster the caster,",
      "Internal inferno burnin', turnin' and churnin' — learnin' your yearnin', discernin' the spurnin',",
      "Double entendre dagger: stagger your swagger, lagger in the stagger — I tagger the tagger,",
      "You talk big but deliver small, crawl in the hall — I appall your call and install the fall,",
      "Triple threat throttle: bottle your model, waddle in throttle — I huddle the muddle,",
      "Chain the disdain: pain in the vein, train to detain — I reign supreme, your dream's in vain,",
      "Your rep's a wreck, check the deck — I peck the spec and eject the reject,",
      "I dismantle your mantle, handle the scandal — candle your handle, I vandal the vandal,",
      "Punch like a phantom, anthem in tandem — random your ransom, I handsome the handsome,",
      "I’m the diss dominator, generator of hate or — waiter for later, I crater your crater,",
      "{target}, you're washed up, cropped up and popped up — I topped up and dropped up your propped up,",
      "Final blow barrage: garage your mirage, sabotage the camouflage — I massage the massage,",
      "I leave you defeated, seated and heated — treated as cheated, repeated and bleated.",
      "{target}, tap out or black out — I'm the track out king in this rap bout.",
    ],
    // New verse inspired by Eminem's brutal disses like "Killshot": personal, savage, name-dropping style attacks
    [
      "{target}, you named yourself after a gun but got a man bun, son — run from the fun, I'm done with the pun,",
      "I'm the rap god, you a fraud in the squad — applaud the clod, I trod on your prod,",
      "Your diss was weak, speak of defeat — heat in the street, I beat your elite,",
      "Internal savage: ravage the average, baggage in savage — I manage the damage,",
      "Double meaning murder: 'stan' your fan and your end — I send the trend, bend the lend,",
      "You hide behind hype, type in the stripe — wipe the pipe, I ripe your tripe,",
      "Triple entendre tucked: 'nail' your coffin, your fail, your hail — I sail the tale,",
      "Chain the pain parade: fade in the shade, blade the grade — I raid your made,",
      "Your career's a carcass, starkness in darkness — harness the sharpness, I park it in starkness,",
      "I eviscerate your ego, lego in the drego — sego the wego, I rego your lego,",
      "Punch like a piston, friction in diction — addiction conviction, your fiction's eviction,",
      "I’m the echo of excellence, negligence in elegance — {target}, your relevance is decadence,",
      "{target}, you quit before the hit, split from the grit — I lit the bit, submit to the wit,",
      "Final fatality flow: low in the blow, show the crow — I grow the throw,",
      "I leave you bodied in the booth, truth in the sleuth — youth in the proof, I roof your spoof.",
      "{target}, bow to the beast — feast on your least, released the deceased.",
    ],
    // Another new verse drawing from "The Sauce" and "Warning": brutal takedowns
    [
      "{target}, you're cleanin' out your closet but it's full of skeletons, peloton of felons — swellin' in hellions,",
      "I sauce you up, boss you up — toss you up, cross you up like a double-cross fuss,",
      "Your warnings weak, speak of the freak — leak in the creek, I peak your bleak,",
      "Internal incineration: nation in station, ration the passion — I fashion your ashen,",
      "Double diss dagger: 'girls' your track and your act — I fact the pact, react the smacked,",
      "You talk tough but bluff in the rough — enough of the stuff, I cuff your bluff,",
      "Triple threat throttle: bottle your model, waddle in huddle — I muddle your puddle,",
      "Chain reaction roast: boast in the toast, host the ghost — I post your most,",
      "Your rep's rented, dented and vented — I scented the tented, prevented the presented,",
      "I dismantle your drama, lama in the karma — arma the pharma, I harm ya with armor,",
      "Punch precision prism: schism in rhythm, victim of system — I twist 'em and list 'em,",
      "I’m the warning whirlwind, grinned in the sinned — pinned the thinned, I win the kin,",
      "{target}, your sauce is stale, pale in the tale — fail in the mail, I nail your veil,",
      "Final blow barrage: garage your mirage, sabotage camouflage — I assuage the massage,",
      "I leave you sauced and lost, cost in the frost — tossed the boss, I cross the gloss.",
      "{target}, choke on the sauce — loss in the boss, I'm the cross you gloss.",
    ],
  ],
  royce: [
    // Previous verses, adding new ones inspired by Royce's lines: punchy, alliance references, technical bars from his Lupe beef and freestyles
    [
      "I’m the punchline punisher, finisher of diminishers — diminish your finish, I spin it to win it,",
      "{target}, your bars are bankrupt, corrupt and disrupt — I erupt and corrupt your corrupt,",
      "Calculated carnage: harness the hardness, sharpness in darkness — I park it in starkness,",
      "Internal incision: precision decision, vision collision — I mission the fission,",
      "Double meaning menace: 'bank' your shot and your dough — I flow the low and overthrow the pro,",
      "I audit your aura, flora and fauna — sauna your drama, I karma your karma,",
      "Triple punch tucked: 'hammer' your nail, your tool, and your slam — I jam the scam,",
      "Chain the pain game: fame in the flame, aim to defame — I claim the blame,",
      "Your crew's a cruise, lose in the news — I ooze the blues and fuse the accuse,",
      "I dismantle your sample, ample the trample — handle the candle, I scandal the vandal,",
      "Punch precision prism: schism in rhythm, victim of system — I list 'em and twist 'em,",
      "I’m the vet in the bet, set the net — get the debt, I fret the threat,",
      "{target}, you're overrated, inflated and dated — I baited and gated your fated,",
      "Final verdict volley: folly in the trolley, jolly your lolly — I collie the collie,",
      "I leave you in ledger red, dead in the head — spread the dread, I thread the shred.",
      "{target}, cash out or crash out — I'm the mash out in this clash bout.",
    ],
    [
      "Heavy hitter habit, rabbit in the sabbath — grab it and stab it, I tab it to nab it,",
      "{target}, your flow's a foreclosure, exposure composure — I closure your closure,",
      "Punchline payload precise, slice the vice — dice the rice, I spice the nice,",
      "Internal inventory: story of glory, gory the Tory — I worry the hurry,",
      "Double entendre debt: 'score' your points and your settle — I mettle the metal,",
      "I calibrate the crate, rate the hate — late to the gate, I ate the plate,",
      "Triple layered ledger: 'check' your move, your pay, your wreck — I deck the spec,",
      "Chain the disdain: pain in the vein, train to detain — I reign in the rain,",
      "Your rep's a receipt, deceit in the seat — I heat the beat and defeat the elite,",
      "I eviscerate the estate, fate in the gate — rate the debate, I hate the wait,",
      "Punch like a piston, listen to friction — diction addiction, conviction's fiction,",
      "I’m the monarch of mark, ark in the dark — spark the lark, I hark the shark,",
      "{target}, you're counterfeit currency, urgency in emergency — I mercy no mercy,",
      "Final swing savage: ravage the average, savage the baggage — I manage the damage,",
      "I leave you liquidated, dated and faded — raided and jaded, paraded as traded.",
      "{target}, bow or break — I'm the stake in your fake.",
    ],
    [
      "Brass knuckle bars, stars in the scars — cars in the jars, I mars the czars,",
      "{target}, your throne's a loaner, owner disowner — toner the boner, I loner the stoner,",
      "Punch precision puncher, muncher of luncher — cruncher the buncher, I huncher the punter,",
      "Internal audit action: fraction of traction, attraction distraction — I action the faction,",
      "Double meaning menace: 'hammer' your head, your tool, your jam — I slam the scam,",
      "I inventory the injury, synergy in energy — enemy of remedy, I penalty the penalty,",
      "Triple threat throttle: bottle the model, waddle in huddle — I muddle the puddle,",
      "Chain the game blame: fame in the lame, aim to defame — I claim the name,",
      "Your crew's a crude feud, rude in the nude — I dude the include and exclude the brood,",
      "I dismantle the mantle, handle the scandal — candle the handle, vandal the sandal,",
      "Punch like a phantom, anthem in tandem — random the ransom, handsome the transom,",
      "I’m the diss director, sector of vector — nectar the rector, I lector the specter,",
      "{target}, you're washed and worn, torn in the sworn — born to be scorned, I warn the forlorn,",
      "Final blow barrage: garage the mirage, sabotage camouflage — massage the massage,",
      "I leave you defeated and deleted, seated and heated — treated as cheated, repeated and bleated.",
      "{target}, it's curtains — burdens in the certain, I certain the curtain.",
    ],
    [
      "I’m the Royce reaper, keeper of the deeper — sleeper in the weeper, I cheaper the steeper,",
      "{target}, your skills are shallow, fallow and callow — I hallow the tallow, swallow the wallow,",
      "Punchline predator, editor of creditor — debtor the better, I letter the setter,",
      "Internal incinerate: rate the debate, fate in the gate — I hate the wait,",
      "Double entendre dagger: stagger the swagger, lagger in tagger — I bagger the nagger,",
      "You flex fake fortune, portion distortion — abortion of caution, I portion the torsion,",
      "Triple punch payload: explode the abode, reload the code — I mode the overload,",
      "Chain reaction rapture: capture the fracture, actor in factor — I tractor the actor,",
      "Your legacy's leggy but beggy, peggy the eggy — I segway the reggae, I leggy the peggy,",
      "I eviscerate evidence, residence in precedence — precedence the decadence, I essence the presence,",
      "Punch precision prism: schism in rhythm, victim of system — I twist 'em and list 'em,",
      "I’m the battle baron, Karen in the sharin' — darin' the carin', I marin' the barren,",
      "{target}, you're obsolete, complete in defeat — I heat the seat and repeat the elite,",
      "Final verdict volley: folly in trolley, jolly the lolly — I collie the folly,",
      "I leave you in ruins, doins' in the bruins — suins' the ruins, I tunin' the tunin'.",
      "{target}, cash the L or crash the shell — I'm the hell in your cell.",
    ],
    // New verse inspired by Royce's freestyles and Lupe diss: alliances, pyramids, technical slaughter
    [
      "{target}, big alliances, clique of lions eyein' elk — built the giant pyramids in alignment with Orion's Belt,",
      "I’m the slaughterhouse slayer, layer upon layer — prayer for the player, I slayer the mayor,",
      "Punchline pyramid peak, speak of the weak — leak in the creek, I peak your bleak,",
      "Internal alliance action: fraction of traction, attraction in faction — I action the reaction,",
      "Double meaning menace: 'raw' your fight and your bite — I site the night, ignite the fight,",
      "You talk beef but brief in the grief — chief in the thief, I relief the belief,",
      "Triple punch tucked: 'hammer' your drum, your run, your sum — I hum the cum,",
      "Chain the game claim: fame in the lame, aim to defame — I claim the name,",
      "Your crew's a loose fuse, news in the blues — I ooze the accuse, fuse the refuse,",
      "I dismantle your dynasty, tiny in the winery — finery the binary, I binary the finery,",
      "Punch like a phantom, anthem in tandem — random your ransom, handsome the transom,",
      "I’m the Royce renegade, parade in the shade — blade the grade, I raid your made,",
      "{target}, your impact's absent, accent in the descent — present the resent, I ascent the present,",
      "Final swing savage: ravage the average, baggage the savage — I manage the damage,",
      "I leave you aligned but declined, signed in the fined — mined the kind, I bind the mind.",
      "{target}, bow to the belt — felt in the welt, I'm the dealt in your melt.",
    ],
    // Another new verse from Royce's lines: 100 round drum, category blast
    [
      "I got a 100 round drum, shoot the first 30 to kill everybody and trash your hook up — category blast the butcher,",
      "{target}, empty the clip just to make that 70 show respect, detect your defect — eject your project,",
      "Punchline precision prism: schism in rhythm, victim of system — I list 'em and twist 'em,",
      "Internal inventory incinerate: rate the debate, fate in the gate — I hate the wait,",
      "Double entendre debt: 'score' your loss and your core — I lore the more, explore the shore,",
      "You flex fake fire, tire in the mire — spire the liar, I wire the higher,",
      "Triple threat throttle: bottle your model, waddle in huddle — I muddle the puddle,",
      "Chain reaction roast: boast in the toast, host the ghost — I post the most,",
      "Your rep's reloaded but exploded, coded in the eroded — I loaded the goaded,",
      "I eviscerate your essence, presence in decadence — precedence the absence, I essence the presence,",
      "Punch like a piston, friction in diction — addiction to conviction, your fiction's eviction,",
      "I’m the vet vending vendettas, bettas in the lettas — mettas the nettas, I settas the gett as,",
      "{target}, your slaughter's self-inflicted, restricted and convicted — I predicted the evicted,",
      "Final blow barrage: garage your mirage, sabotage the camouflage — I assuage the massage,",
      "I leave you drummed and done, fun in the run — sun the gun, I won the one.",
      "{target}, reload or explode — code in the node, I'm the road you owed.",
    ],
  ],
  lupe: [
    // Previous verses, adding new ones inspired by Lupe's diss to Royce: passive aggressive, impact references, intellectual burns
    [
      "I paint the mural of your downfall, hall of the small — call to the wall, I install the stall,",
      "{target}, your story's a sketch, etch in the fetch — stretch the wretch, I kvetch the letch,",
      "Metaphor mosaic: prosaic in the chaotic, exotic neurotic — I erotic the robotic,",
      "Internal introspection: section of direction, erection of reflection — I detection the infection,",
      "Double read riddle: 'bank' your trust and your shore — I core the lore, explore the more,",
      "I fold histories into hierarchies, queries in theories — wearies the series, I dearies the dearies,",
      "Triple layered labyrinth: path in the math, wrath in the bath — I hath the aftermath,",
      "Chain the narrative chain: pain in the gain, train to the main — I reign in the sane,",
      "Your philosophy's phony, boney and stony — I Tony the crony, lonely the phony,",
      "I architect the arc, park in the dark — spark the lark, I hark the shark,",
      "Verse like a vortex, cortex in the cortex — index the subtext, I context the pretext,",
      "I’m the sage of the stage, page in the rage — cage the wage, I engage the sage,",
      "{target}, your wisdom's withered, slithered and dithered — I quivered the livered, delivered the shivered,",
      "Final mural message: passage in theassage,assage theassage — Iassage theassage,",
      "I leave you reflected, detected and rejected — selected as ejected, projected as dejected.",
      "{target}, read the wall or fall — I'm the call in your hall.",
    ],
    [
      "Mural margins murmur, murmur the firmer — warmer the swarmer, I charmer the harmer,",
      "{target}, your canvas is blank, rank in the tank — bank the prank, I crank the flank,",
      "Metaphor metropolis:ropolis in theopolis,opolis theopolis — Iopolis theopolis,",
      "Internal illumination: nation of station, ration the passion — I fashion the ashen,",
      "Double meaning map: 'score' your mark and your debt — I set the net, fret the threat,",
      "I stitch skylines into sermons, vermins in the hermins — fermions the germins, I termins the termins,",
      "Triple stacked scripture: picture the fixture, mixture in stricture — I structure the rupture,",
      "Chain the chronicle chain: pain in the gain, train to the main — I reign in the vein,",
      "Your intellect's inert, hurt in the dirt — shirt the flirt, I alert the assert,",
      "I navigate the narrative, narrative in imperative — declarative the comparative, I narrative the narrative,",
      "Verse vortex vision: division in precision, incision the mission — I vision the fission,",
      "I’m the philosopher's fire, wire in the lyre — tire the mire, I inspire the spire,",
      "{target}, your thoughts are thawed, flawed and clawed — I jawed the awed, thawed the flawed,",
      "Final fold finale: alley in the tally, rally the valley — I sally the galley,",
      "I leave you in the margin, bargain for the jargon — argon the pargon, I argon the argon.",
      "{target}, decode or erode — I'm the node in your code.",
    ],
    [
      "I fold continents into contempt, tempt in the exempt — preempt the attempt, I contempt the contempt,",
      "{target}, your world's a wrinkle, sprinkle in the twinkle — crinkle the tinkle, Iinkle theinkle,",
      "Metaphor masonry: sonry in the onry, conry the donry — I onry the sonry,",
      "Internal insight incision: vision of division, precision the mission — I fission the condition,",
      "Double read river: 'flow' your stream and your style — I tile the mile, file the pile,",
      "I thread timelines through thresholds, holds in theolds — scolds theolds, Iolds theolds,",
      "Triple buried basement: ment in theent, sent theent — Ient theent,",
      "Chain the saga chain: pain in the gain, train to the main — I reign in the plain,",
      "Your culture's corrupted, erupted and disrupted — I instructed the constructed, conducted the inducted,",
      "I blueprint the battle, rattle in the cattle — tattle the prattle, I battle the saddle,",
      "Verse like a vessel, nestle in the wrestle — pestle the trestle, I estle the estle,",
      "I’m the mural mastermind, bind in the find — mind the grind, I kind the blind,",
      "{target}, your essence is empty, tempt me with plenty — twenty the centry, I entry the sentry,",
      "Final passage payoff: off in the off, scoff the off — I off the off,",
      "I leave you mapped and trapped, snapped in the wrapped — capped the zapped, I lapped the tapped.",
      "{target}, enter the mural or perish — cherish the garish, I parish the parish.",
    ],
    [
      "I’m the Lupe labyrinth leader, reader of the bleeder — seeder the weeder, I feeder the needer,",
      "{target}, your mind's a maze misplaced, disgraced in the chased — laced the paced, I faced the waste,",
      "Metaphor matrix multiply: ply in the fly, sly the why — I high the sigh,",
      "Internal intellect incinerate: rate the debate, fate in the gate — I hate the wait,",
      "Double entendre doctrine: 'check' your faith and your move — I prove the groove, remove the prove,",
      "You peddle pseudo-profound, ground in the hound — bound the sound, I found the mound,",
      "Triple layered lore: core in the more, shore the bore — I ore the store,",
      "Chain the chronicle contempt: tempt in the exempt, preempt the attempt — I contempt the contempt,",
      "Your wisdom's withered whisper, crisper in the blister — mister the sister, I lister the twister,",
      "I dissect your doctrine, auction the concoction — option the adoption, I suction the unction,",
      "Verse vortex vendetta: setta in the getta, betta the letta — I metta the netta,",
      "I’m the philosophical phantom, anthem in tandem — random the ransom, handsome the transom,",
      "{target}, you're intellectually insolvent, solvent in the solvent — I solvent the insolvent,",
      "Final mural massacre: acre in the maker, shaker the baker — I taker the faker,",
      "I leave you enlightened but frightened, tightened the brightened — heightened the sighted.",
      "{target}, decode the diss or dismiss — I'm the abyss in your bliss.",
    ],
    // New verse inspired by Lupe's "Silence of the Lambda": passive aggressive, impact burns
    [
      "{target}, look at all this passive aggressive pussying — all the past neglectful positions these pussies put me in,",
      "I’m the lambda silent slayer, layer upon prayer — slayer the mayor, I payer the layer,",
      "Metaphor mosaic menace: penance in the sentence, entrance the penance — I dense the immense,",
      "Internal illumination incinerate: rate the debate, fate in the gate — I hate the wait,",
      "Double meaning map: 'impact' your hit and your lack — I track the stack, hack the pack,",
      "You kit-kat chit-chat syntax, tax on the fax — relax the max, I ax the wax,",
      "Triple stacked scripture: picture the mixture, fixture in stricture — I rupture the structure,",
      "Chain the narrative neglect: effect in the defect, select the reject — I eject the project,",
      "Your positions are passive, massive in the lassive — assive the massive, I passive the assive,",
      "I navigate the neglect, direct the suspect — inspect the reflect, I detect the eject,",
      "Verse vortex vision: division in precision, mission the incision — I fission the condition,",
      "I’m the Lupe lyric leviathan, titan in the enlighten — frighten the heighten, I tighten the brighten,",
      "{target}, your impact's imaginary, vary in the scary — carry the dairy, I marry the fairy,",
      "Final fold finale: alley in tally, valley the rally — I sally the galley,",
      "I leave you silenced in lambda, gamma in the drama — mama the trauma, I comma the karma.",
      "{target}, hush in the rush — crush in the blush, I'm the push in your tush.",
    ],
    // Another new verse from Lupe's acapella and Mickey involvement: master spaces, phone bars
    [
      "{target}, master all the spaces — faces in the places, races the traces — I aces the bases,",
      "I’m the fiasco phantom, anthem in the tandem — random the ransom, handsome the transom,",
      "Metaphor matrix master: plaster the faster, disaster the caster — I master the blaster,",
      "Internal insight incision: vision of division, precision the mission — I fission the condition,",
      "Double read riddle: 'phone' your call and your diss — I miss the bliss, kiss the abyss,",
      "You rant shirtless, worthless in the mirthless — birthless the earthless, I girthless the worthless,",
      "Triple layered labyrinth: path in math, wrath in bath — I hath the aftermath,",
      "Chain the saga silence: violence in compliance, reliance the defiance — I alliance the science,",
      "Your bars are borrowed, sorrowed and hollowed — followed the swallowed, I wallowed the followed,",
      "I blueprint the battle, rattle the cattle — tattle the prattle, I saddle the battle,",
      "Verse like a vessel, nestle the wrestle — pestle the trestle, I estle the vessel,",
      "I’m the Lupe loaded lux, flux in the crux — ducks the bucks, I tux the lux,",
      "{target}, your line's crossed, lost in the frost — cost the boss, I toss the gloss,",
      "Final passage payoff: off in the scoff, coff the off — I off the off,",
      "I leave you phoned and owned, toned in the groaned — moaned the loaned, I droned the stoned.",
      "{target}, hang up or bang up — rang up the sang up, I'm the fang up in your hang up.",
    ],
  ],
  diss: [
    // Previous verses, adding new ones from general battle rap: brutal, funny roasts, KO punchlines
    [
      "{target}, you parade like a king but your kingdom's a kennel — fennel in the kennel, I channel the panel,",
      "I expose your facade, fraud in the squad — applaud the clod, I trod the prod,",
      "Your bars are borrowed blueprints, fruits in the suits — roots the loots, I shoots the toots,",
      "Internal incinerate your image: scrimmage in the dimmage, image the rim mage — I damage the damage,",
      "Double diss dagger: 'crown' your fake head and your fall — I call the stall, install the wall,",
      "You flex rented rides, hides in the tides — sides the guides, I slides the prides,",
      "Triple threat throttle: bottle your model, waddle in throttle — I huddle the muddle,",
      "Chain the shame game: fame in the lame, aim to defame — I claim the blame,",
      "Your crew's a comedy, tragedy in the strategy — pageantry the battery, I flattery the lattery,",
      "I roast your resume, day in the fray — play the lay, I slay the bay,",
      "Punchline payload: explode your code, reload the mode — I overload the road,",
      "I’m the diss demolisher, polisher of the abolisher — abolisher the polisher, I demolisher the demolisher,",
      "{target}, your legacy's laughable, affable in the gaffable — staffable the chaffable, I raffle the baffle,",
      "Final blow barrage: garage your mirage, sabotage the camouflage — I massage the assuage,",
      "I leave you dismantled and canceled, handled the scandal — candle the mantle, I vandal the handle.",
      "{target}, tap out or black out — I'm the smack out in this track bout.",
    ],
    [
      "{target}, your throne's a toilet, spoil it and oil it — coil it the foil it, I boil it the soil it,",
      "I flip your fake fame to shame, game in the lame — blame the name, I tame the flame,",
      "Your disses deflect, reflect the neglect — elect the eject, I detect the defect,",
      "Internal implosion: erosion of notion, commotion in ocean — I potion the devotion,",
      "Double meaning menace: 'beat' your drum and your ass — I pass the class, mass the grass,",
      "You hide behind hype, type in the stripe — wipe the pipe, I ripe the tripe,",
      "Triple punch tucked: 'hammer' your nail, your head, your jam — I slam the scam,",
      "Chain reaction roast: toast in the boast, host the ghost — I post the most,",
      "Your fans are fleeting, meeting the greeting — seating the beating, I eating the sheeting,",
      "I audit your authenticity, city in the pity — witty the nitty, I gritty the shitty,",
      "Punch precision: decision incision, vision collision — I mission the fission,",
      "I’m the battle rap butcher, future in the suture — tutor the looter, I shooter the rooter,",
      "{target}, you're over before you started, parted and carted — hearted the smarted, I darted the farted,",
      "Final verdict volley: folly in the trolley, jolly your lolly — I collie the molly,",
      "I leave you buried in bars, stars in the scars — cars the jars, I mars the czars.",
      "{target}, it's body bag time — rhyme in the crime, I'm the prime in your slime.",
    ],
    [
      "Multisyllable mutilate: state in the hate, rate the debate — I gate the fate,",
      "{target}, your skills are subpar, far in the car — bar the star, I jar the tar,",
      "I shred your shred, dread in the head — thread the bread, I spread the dead,",
      "Internal rhyme roast: boast in the ghost, host the most — I post the toast,",
      "Double entendre destroy: 'toy' your play and your fake — I make the take, break the stake,",
      "You claim clout but it's cloud, loud in the crowd — proud the shroud, I allowed the bowed,",
      "Triple layered lacerate: rate in the gate, fate the date — I hate the wait,",
      "Chain the pain parade: fade in the shade, blade the grade — I raid the made,",
      "Your career's a carcass, harness the darkness — starkness the parkness, I markness the harkness,",
      "I eviscerate evidence, residence in decadence — precedence the essence, I presence the absence,",
      "Punch like a phantom, anthem in tandem — random the ransom, handsome the handsome,",
      "I’m the diss dominator, generator of hater — waiter the later, I crater the crater,",
      "{target}, you're washed up wreckage, message in the presage — I assuage theassage,",
      "Final swing savage: ravage the average, baggage the savage — I manage the damage,",
      "I leave you defeated, seated and heated — treated as cheated, repeated and bleated.",
      "{target}, choke on the smoke — I'm the joke in your broke.",
    ],
    [
      "Remember your rise? Lies in the eyes — spies the ties, I pries the cries,",
      "{target}, your peak was a peek, weak in the creek — seek the leak, I tweak the meek,",
      "I catalog your collapses, lapses in the synapses — perhaps the maps, I traps the gaps,",
      "Internal expose explosion: notion in the ocean, motion the potion — I devotion the emotion,",
      "Double diss debt: 'score' your loss and your settle — I mettle the metal, petal the settle,",
      "You borrow bars badly, sadly in the madly — gladly the padly, I tadly the hadly,",
      "Triple threat throttle: bottle the model, waddle in huddle — I muddle the puddle,",
      "Chain the shame chronicle: article in the particle, sparkle the darkle — I markle the sparkle,",
      "Your authenticity's absent, accent in the ascent — descent the present, I resent the descent,",
      "I roast your roster, foster the imposter — coster the roster, I oster the foster,",
      "Punch precision prism: schism in rhythm, victim of system — I twist 'em and list 'em,",
      "I’m the battle rap baron, sharin' in the Karen — darin' the carin', I marin' the barren,",
      "{target}, you're irrelevant relic, pellic in the tellic — mellic the hell ic, I sell ic the well ic,",
      "Final mural of mockery: lockery in the dockery, crockery the mockery — I stockery the rockery,",
      "I leave you archived and starved, carved in the larved — starved the garved, I harved the tarved.",
      "{target}, history's trash — cash in the ash, I'm the flash in your crash.",
    ],
    [
      "I’m the diss destroyer, employer of the annoyer — deployer the destroyer, I joyer the lawyer,",
      "{target}, your vibe's a virus, iris in the Cyrus — virus the iris, I Cyrus the virus,",
      "Multisyllable massacre master: plaster the faster, disaster the caster — I master the blaster,",
      "Internal rhyme rampage: page in the cage, rage the stage — I wage the sage,",
      "Double entendre dagger: stagger the swagger, lagger in the tagger — I bagger the nagger,",
      "You spit soft syllables, killables in the fillables — billables the thrillables, I willables the skillables,",
      "Triple punch payload: explode the code, reload the mode — I overload the road,",
      "Chain reaction roast: boast in the toast, host the ghost — I post the most,",
      "Your legacy's laugh track, back in the hack — track the lack, I pack the sack,",
      "I eviscerate your ego, lego in the drego — sego the wego, I rego the lego,",
      "Punch like a piston phantom: anthem in tandem, random the ransom — handsome the transom,",
      "I’m the battle rap behemoth, goth in the moth — both the oath, I troth the growth,",
      "{target}, you're fodder for the flame, name in the shame — game the blame, I tame the fame,",
      "Final blow barrage: garage the mirage, sabotage the camouflage — I assuage the massage,",
      "I leave you bodied and buried, hurried in the worried — curried the flurried, I turried the scurried.",
      "{target}, it's game over — rover in the clover, I'm the dover in your over.",
    ],
    [
      "{target}, your crown's cardboard counterfeit, deficit in the benefit — I profit it the forfeit it,",
      "I flip your flex to flop, stop in the hop — cop the drop, I shop the prop,",
      "Your disses deflate, rate in the gate — late the hate, I fate the state,",
      "Internal incinerator: later the crater, greater the hater — I waiter the traitor,",
      "Double meaning menace: 'trash' your bars and your worth — I earth the birth, girth the mirth,",
      "You hide hype in hollow halls, calls in the falls — walls the stalls, I balls the malls,",
      "Triple layered laceration: nation in the station, ration the passion — I fashion the ashen,",
      "Chain the disdain parade: fade in the shade, blade the grade — I raid the made,",
      "Your crew crumbles quick, thick in the sick — pick the lick, I trick the wick,",
      "I roast your relevance, elegance in negligence — precedence the decadence, I essence the presence,",
      "Punch precision payback: track in the black, stack the lack — I hack the crack,",
      "I’m the diss dominatrix, matrix in the patrix — hatrix the datrix, I latrix the matrix,",
      "{target}, you're extinct exhibit, inhibit the prohibit — I exhibit the inhibit,",
      "Final swing savage: ravage the average, baggage the savage — I manage the ravage,",
      "I leave you silenced and shamed, named in the framed — tamed the blamed, I aimed the maimed.",
      "{target}, bow to the battle king — ring in the sting, I'm the thing in your fling.",
    ],
    // New verse with general battle rap roasts: funny, brutal lines like sweat trickling, bankhead
    [
      "{target}, I can hear sweat tricklin' down your cheek — heartbeat sound like Sasquatch feet, thunderin' shakin' the concrete,",
      "Your rap game's all fucked up now, what we gonna do now — how we gonna eat man, your back around clown,",
      "Internal savage sweat: bet in the wet, set the debt — I fret the threat,",
      "Double entendre destroy: 'bankhead' your yell and your fell — I tell the sell, hell the bell,",
      "You yell bankhead and felt left out — I ain't mention your name, that's what all this bout,",
      "Triple layered lacerate: rate in the gate, fate the date — I hate your wait,",
      "Chain the pain parade: fade in the shade, blade the grade — I raid your made,",
      "Your disses are dumb, numb in the thumb — crumb in the slum, I hum the drum,",
      "I roast your roast, toast in the ghost — host the most, I post your coast,",
      "Punch like a phantom, anthem in tandem — random your ransom, handsome the transom,",
      "I’m the battle rap butcher, suture the future — looter the tutor, I shooter the rooter,",
      "{target}, you're stupid joke, choke in the smoke — broke in the poke, I invoke the yoke,",
      "Final blow barrage: garage your mirage, sabotage the camouflage — I assuage the massage,",
      "I leave you roasted and toasted, boasted the ghosted — hosted the posted, I coasted the roasted.",
      "Listen, you have no damn brain — doctors cut your head open and found stains, pains in the chains.",
      "{target}, I'm the nerd you're the dummy — I have common sense, you run to your mummy.",
    ],
    // Another new verse: more roasts like Kimbo Slice, Mayweather money
    [
      "{target}, Kimbo Slice on the pad when I write — that Mayweather money lookin' funny in the light,",
      "I’m omnipotent like Deadpool, cool in the tool — fool in the pool, I rule the school,",
      "Internal rhyme rampage: page in the cage, rage the stage — I wage the sage,",
      "Double diss dagger: 'toy' your play and your slay — I may the day, way the hay,",
      "You won't be kind, sick in the head — dead in the bed, I fed the dread,",
      "Triple punch payload: explode the code, reload the mode — I overload the road,",
      "Chain reaction roast: boast in the toast, host the ghost — I post the most,",
      "Your flex is frail, tale in the pale — sail the fail, I nail the mail,",
      "I eviscerate your essence, presence in the decadence — essence the presence, I decadence the absence,",
      "Punch precision payback: track in the black, stack the lack — I hack the crack,",
      "I’m the devastating beast, least in the feast — east the yeast, I released the ceased,",
      "Wouldn't care in the least if your body increased — pieced in the ceased, I fleeced the priest,",
      "Final swing savage: ravage the average, savage the baggage — I manage the damage,",
      "I leave you burned and turned, learned in the urn — spurn the yearn, I churn the burn.",
      "{target}, get your head shot in Ishkabibil — wake up confused with Ishkadribble.",
      "Hey yo, listen — why don't you hit him with a hollow, the way you follow's shallow.",
    ],
  ],

  jcole: [
    // Previous verses, adding new ones inspired by J. Cole's verses: deep, introspective disses like in "7 Minute Drill", features
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
    [
      "Block to the boardroom battle, rattle in the cattle — tattle the prattle, I saddle the battle,",
      "{target}, your hustle's hollow, follow the swallow — wallow the tallow, I hallow the shallow,",
      "I flip failures to fuel, cool in the duel — rule the school, I tool the fool,",
      "Internal insight incinerate: rate the debate, fate in the gate — I hate the wait,",
      "Double read redemption: 'score' your come up and your debt — I set the net, fret the threat,",
      "You peddle pretense, sense in the dense — tense the fence, I hence the thence,",
      "Triple stacked story: glory in the gory, story the Tory — I worry the hurry,",
      "Chain the chronicle chain: pain in the gain, train to the main — I reign in the vein,",
      "Your authenticity's absent, accent in the ascent — descent the present, I resent the ascent,",
      "I narrate your nadir, nadir in the raider — trader the fader, I grader the shader,",
      "Verse vortex vendetta: setta in the getta, betta the letta — I metta the netta,",
      "I’m the introspective incinerator, later the crater — greater the hater, I waiter the traitor,",
      "{target}, your mirror's misleading, bleeding in the seeding — needing the heeding, I feeding the reading,",
      "Final lesson lash: cash in the ash, dash the flash — I mash the trash,",
      "I leave you reflected and rejected, detected the ejected — selected the dejected.",
      "{target}, grow or go — I'm the flow in your low.",
    ],
    [
      "I’m the Cole critic, cryptic in the lytic — mytic the pytic, I sytic the nytic,",
      "{target}, your tale's tall but falls, calls in the halls — walls the stalls, I balls the malls,",
      "Introspective insult: result in the consult, adult the tumult — I cult the insult,",
      "Internal moral massacre: acre in the maker, shaker the baker — I taker the faker,",
      "Double entendre doctrine: 'check' your path and your pay — I day the way, play the stay,",
      "You stumble on stages, pages in the rages — cages the wages, I sages the stages,",
      "Triple layered lore: core in the more, shore the bore — I ore the store,",
      "Chain the saga shame: fame in the lame, aim the blame — I claim the name,",
      "Your journey's a joke, poke in the yoke — smoke the broke, I choke the invoke,",
      "I chronicle your crash, dash in the ash — cash the trash, I mash the flash,",
      "Verse like a verdict, predict the addict — strict the depict, I kick the trick,",
      "I’m the battle bard, hard in the card — guard the yard, I shard the lard,",
      "{target}, your dream's deferred, word in the bird — herd the absurd, I curd the stirred,",
      "Final wisdom whip: tip in the lip, slip the grip — I rip the trip,",
      "I leave you enlightened but tightened, frightened the brightened — heightened the sighted.",
      "{target}, reflect or deflect — I'm the effect in your defect.",
    ],
    // New verse inspired by J. Cole's "7 Minute Drill": dissing decline, boring bars
    [
      "{target}, your first shit was classic, your last shit was tragic — your middle shit was average, static in the attic,",
      "I’m the Cole chronicler, tickler of the pickler — sickler the trickler, I nickler the fickler,",
      "Introspective insight: light in the night, fight the slight — I might the height,",
      "Internal rhyme reflection: section of direction, erection reflection — I detection infection,",
      "Double mean moral: 'drill' your time and your kill — I fill the bill, thrill the mill,",
      "You humblin' on the mic, hype in the type — stripe the pipe, I ripe the tripe,",
      "Triple stacked story: glory in the Tory, story the gory — I worry the hurry,",
      "Chain the narrative nadir: raider in the fader, trader the shader — I grader the invader,",
      "Your bars are boring, snoring in the pouring — touring the flooring, I scoring the whoring,",
      "I map your decline, line in the shine — mine the dine, I fine the wine,",
      "Verse like a vignette, net in the set — bet the debt, I fret the threat,",
      "I’m the seven minute savage, ravage the average — baggage the savage, I manage the damage,",
      "{target}, lord don't make me smoke you, choke you in the provoke you — invoke you the revoke you,",
      "Final wisdom wave: save in the cave, brave the grave — I pave the rave,",
      "I leave you drilled and filled, thrilled in the killed — willed the skilled, I billed the milled.",
      "{target}, push come to shove — love in the glove, I'm the above in your dove.",
    ],
    // Another new verse from Cole's features: higher than niggas, glass empty
    [
      "{target}, I'm higher than niggas that don't need a bag for the reef or some — see the glass is empty, I see a glass half,",
      "The kind of half that tempt me — empty the plenty, twenty the centry, I entry the sentry,",
      "Introspective insult: result in consult, adult the tumult — I cult the insult,",
      "Internal moral measure: treasure in pressure, measure the leisure — I seizure the teaser,",
      "Double read riddle: 'score' your high and your low — I flow the show, grow the know,",
      "You chase the bag, drag in the lag — sag in the tag, I rag the flag,",
      "Triple layered lesson: session in possession, confession aggression — I progression regression,",
      "Chain the saga score: more in the core, shore the bore — I ore the store,",
      "Your grind's a gimmick, mimic in limbic — cynic the clinic, I picnic the mimic,",
      "I narrate your nadir, raider in fader — trader the shader, I grader the invader,",
      "Verse vortex vendetta: setta in getta, betta the letta — I metta the netta,",
      "I’m the Cole glass gazer, laser in the phaser — chaser the racer, I spacer the tracer,",
      "{target}, your glass is cracked, fact in the act — pact the tact, I react the smacked,",
      "Final fold finale: alley in tally, valley the rally — I sally the galley,",
      "I leave you half empty, tempt me with plenty — twenty the centry, I entry the sentry.",
      "{target}, fill up or spill up — hill up the mill up, I'm the thrill up in your chill up.",
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
    weapons: [
      "razor",
      "spear",
      "blades",
      "guillotine",
      "dagger",
      "cannon",
      "arrow",
      "bomb",
    ],
    nature: [
      "storm",
      "tsunami",
      "hurricane",
      "volcano",
      "earthquake",
      "tornado",
      "avalanche",
      "flood",
    ],
    architecture: [
      "fortress",
      "labyrinth",
      "pillars",
      "throne",
      "tower",
      "bridge",
      "vault",
      "castle",
    ],
    myth: [
      "leviathan",
      "phoenix",
      "hydra",
      "titan",
      "minotaur",
      "cyclops",
      "siren",
      "griffin",
    ],
    tech: [
      "circuit",
      "virus",
      "firewall",
      "hacker",
      "algorithm",
      "matrix",
      "code",
      "glitch",
    ],
    street: [
      "alley",
      "block",
      "corner",
      "porch",
      "ledger",
      "hustle",
      "grind",
      "trap",
    ],
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
      imagery.nature.concat(
        imagery.myth,
        imagery.weapons,
        imagery.tech,
        imagery.street
      )
    );
    const met2 = pick(
      imagery.architecture.concat(imagery.myth, imagery.nature, imagery.tech)
    );

    // choose rhyme tail — if rhymeSeed provided, sometimes mutate it slightly to avoid identical tails
    let tail;
    if (rhymeSeed && Math.random() < 0.85) {
      // small chance to slightly vary tail (append a small suffix) for freshness
      tail =
        rhymeSeed +
        (Math.random() < 0.3 ? pick(["ness", "ing", "ed", "er", "s"]) : "");
    } else {
      const bankKey =
        Math.floor(Math.random() * Object.keys(rhymeBanks).length) + 1;
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
      if (bank && bank.length && Math.random() < 0.7) {
        // increased chance to use seeds
        let allLines = [];
        bank.forEach((verse) => {
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
      let rhymeSeed = pick(
        rhymeBanks[
          Math.floor(Math.random() * Object.keys(rhymeBanks).length) + 1
        ]
      );
      while (
        usedRhymeSeeds.has(rhymeSeed) &&
        usedRhymeSeeds.size <
          Object.keys(rhymeBanks).reduce(
            (acc, k) => acc + rhymeBanks[k].length,
            0
          )
      ) {
        rhymeSeed = pick(
          rhymeBanks[
            Math.floor(Math.random() * Object.keys(rhymeBanks).length) + 1
          ]
        );
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
        candidate =
          candidate +
          pick([
            " — twisted",
            " — reloaded",
            " — flipped",
            " — remixed",
            " — upgraded",
          ]);
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
      mention:
        targetId && Math.random() < 0.25
          ? { id: targetId, name: targetName }
          : null, // reduced frequency
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
