module.exports.config = {
  name: "warv2",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "MrDeveloper & Grok",
  usePrefix: true,
  description:
    "Epic rap-battle disses with freestyle, old-school, and Eminem-style punchlines! Use 'warv2', 'warv2 @username', or 'warv2 random'!",
  commandCategory: "group",
  usages:
    "warv2 [optional: @username | random] [optional: maxLines] [optional: delayMs]",
  cooldowns: 5,
  dependencies: {},
};

// Ported from kiss.js for robust name resolution
async function resolveDisplayNames(api, event, senderId, targetId) {
  let senderName = null;
  let targetName = null;
  let threadInfo = null;

  // 1) Try mentions
  if (event.mentions) {
    for (const [id, data] of Object.entries(event.mentions)) {
      if (String(id) === String(senderId) && data?.name) senderName = data.name;
      if (String(id) === String(targetId) && data?.name) targetName = data.name;
    }
  }

  // 2) Try event.senderName
  if (!senderName && event.senderName) senderName = event.senderName;

  // 3) Try threadInfo safely
  try {
    threadInfo = await new Promise((resolve) => {
      api.getThreadInfo(event.threadID, (err, info) =>
        resolve(err ? null : info)
      );
    });
  } catch (e) {
    console.warn("⚠ Could not fetch thread info:", e.error || e.message || e);
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

  // 4) Try getUserInfo as final fallback
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
    senderName: senderName || "You",
    targetName: targetName || "Random Fool",
  };
}

module.exports.run = async function ({ api, args, event }) {
  const threadID = event.threadID;
  let targetId = null;
  let targetName = null;
  let maxLines = 120; // Default max lines
  let delayMs = 8500; // Default delay of 8.5 seconds to avoid FB block

  // Parse arguments for username, maxLines, and delayMs
  if (args.length > 0) {
    // Join all args to handle multi-word usernames like "Final Chapter"
    let userInput = args.join(" ").trim();
    // Extract maxLines and delayMs if provided
    const numericArgs = args.filter((arg) => !isNaN(arg));
    if (numericArgs.length > 0) {
      maxLines = Math.min(parseInt(numericArgs[0]), 120); // Cap at 120 lines
      userInput = args.slice(0, args.indexOf(numericArgs[0])).join(" ").trim();
    }
    if (numericArgs.length > 1) {
      delayMs = Math.max(parseInt(numericArgs[1]), 5000); // Minimum 5s delay
    }

    if (userInput.toLowerCase() === "random") {
      try {
        const threadInfo = await new Promise((resolve) => {
          api.getThreadInfo(threadID, (err, info) =>
            resolve(err ? null : info)
          );
        });
        if (
          threadInfo?.participantIDs &&
          Array.isArray(threadInfo.participantIDs)
        ) {
          const others = threadInfo.participantIDs.filter(
            (id) => id !== event.senderID
          );
          if (others.length > 0) {
            const randomId = others[Math.floor(Math.random() * others.length)];
            const randomUser = threadInfo.userInfo.find(
              (u) => String(u.id) === String(randomId)
            );
            targetId = randomId;
            targetName = randomUser?.name || "Random Fool";
          } else {
            await api.sendMessage(
              "No one else in the group to roast! Droppin' bars anyway!",
              threadID
            );
          }
        }
      } catch (error) {
        console.error("Error fetching thread info:", error);
        await api.sendMessage(
          "Error fetching user list, but the bars keep comin'!",
          threadID
        );
      }
    } else if (userInput) {
      try {
        const threadInfo = await new Promise((resolve) => {
          api.getThreadInfo(threadID, (err, info) =>
            resolve(err ? null : info)
          );
        });
        if (threadInfo?.userInfo && Array.isArray(threadInfo.userInfo)) {
          const targetUser = threadInfo.userInfo.find(
            (user) =>
              user.name
                .toLowerCase()
                .includes(userInput.toLowerCase().replace(/@/g, "")) ||
              userInput
                .toLowerCase()
                .replace(/@/g, "")
                .includes(user.name.toLowerCase())
          );
          if (targetUser) {
            targetId = targetUser.id;
            targetName = targetUser.name;
          } else {
            await api.sendMessage(
              `Couldn't find user "${userInput}". Droppin' bars with a random target!`,
              threadID
            );
            const others = threadInfo.participantIDs.filter(
              (id) => id !== event.senderID
            );
            if (others.length > 0) {
              const randomId =
                others[Math.floor(Math.random() * others.length)];
              const randomUser = threadInfo.userInfo.find(
                (u) => String(u.id) === String(randomId)
              );
              targetId = randomId;
              targetName = randomUser?.name || "Random Fool";
            }
          }
        }
      } catch (error) {
        console.error("Error fetching thread info:", error);
        await api.sendMessage(
          "Error fetching user list, but the bars keep comin'!",
          threadID
        );
      }
    }
  }

  // Resolve display names for sender and target
  const { senderName, targetName: resolvedTargetName } =
    await resolveDisplayNames(api, event, event.senderID, targetId);
  targetName = targetName || resolvedTargetName;

  // Messages with rap-battle style disses
  let messages = [
    { body: "Yo, gather ‘round, it’s time to torch this chat!", at: 0 },
    { body: "I’m spittin’ flames, y’all just a doormat!", at: 0 },
    {
      body: "Freestyle assassin, surpassin’ your passion, amassin’ a blastin’ that’s crashin’ your faction!",
      at: 0,
    },
    { body: "I’m servin’ these bars, you’re just a side dish!", at: 0 },
    {
      body: "Eminem inferno, I burn through your ego, you’re zero, a weirdo, my hero’s a spear-throw!",
      at: 0,
    },
    { body: "I’m sinkin’ your ship, you’re losin’ your grip!", at: 0 },
    {
      body: "Old-school titan, I’m writin’ and smitin’, ignitin’ and fightin’, you’re bitin’ and frightenin’!",
      at: 0,
    },
    { body: "I’m droppin’ bombs quick, your crew won’t last!", at: 0 },
    { body: "You think you’re tough? You’re soft like a plush!", at: 0 },
    { body: "I’m paintin’ this chat with a lyrical brush!", at: 0 },
    {
      body: "Eminem venom, I’m pennin’ a menace, relentless, defenseless, you’re senseless in sentence!",
      at: 0,
    },
    { body: "I’m rulin’ this cypher, you’re just a fool!", at: 0 },
    {
      body: "Punchline apocalypse, I’m rippin’ your politics, droppin’ this hotness, you’re floppin’ in tropics!",
      at: 0,
    },
    { body: "Your rhymes so cheesy, they’re stinkin’ like brie!", at: 0 },
    { body: "I’m the king of this chat, you’re kneelin’ to me!", at: 0 },
    {
      body: "Punchline predator, editor of your creditor, shredder of your debtor, better than your trendsetter!",
      at: 0,
    },
    { body: "I’m slicin’ through fakes like a lyrical ham!", at: 0 },
    {
      body: "Freestyle guillotine, I’m keen with the sheen, intervene with the mean, you’re unseen in the scene!",
      at: 0,
    },
    { body: "I’m blazin’ this track, you’re lost in the chase!", at: 0 },
    { body: "Your ego’s inflated, but your skills deflate!", at: 0 },
    { body: "I’m spinnin’ these words, you’re stuck at the gate!", at: 0 },
    {
      body: "Freestyle inferno, I burn slow, you churn slow, discern no, you learn woe, my flow’s a tornado!",
      at: 0,
    },
    { body: "I’m droppin’ these bars like bombs on a tank!", at: 0 },
    {
      body: "Old-school massacre, I’m faster, a master, disaster for your cast, you’re plastered and outcast!",
      at: 0,
    },
    { body: "I’m runnin’ this chat, you’re left all alone!", at: 0 },
    { body: "You’re tryin’ to flex, but your muscles are frail!", at: 0 },
    { body: "I’m settin’ these sails, you’re destined to fail!", at: 0 },
    {
      body: "Old-school slaughter, I’m hotter than lava, you falter, I alter, your psalter’s a pauper!",
      at: 0,
    },
    { body: "I’m stealin’ this show, you’re just a side job!", at: 0 },
    {
      body: "Eminem eclipse, I’m rippin’ your script, equipped to decrypt, you’re flipped and unzipped!",
      at: 0,
    },
    { body: "I’m flippin’ this script, you’re sinkin’ forthwith!", at: 0 },
    { body: "Your flow’s got no rhythm, it’s missin’ the beat!", at: 0 },
    { body: "I’m roastin’ this chat, you’re feelin’ the heat!", at: 0 },
    { body: "You’re stuck in the mud, I’m clean with the shine!", at: 0 },
    { body: "My rhymes cut so deep, like a lyrical spine!", at: 0 },
    { body: "I’m the champ of this war, you’re just a pretender!", at: 0 },
    {
      body: "Eminem precision, incision with vision, derision collision, your mission’s remission!",
      at: 0,
    },
    { body: "This rap’s runnin’ long, but I’m still in my zone!", at: 0 },
    { body: "I’m droppin’ these mics, now leave me alone!", at: 0 },
    { body: "Peace out, this chat’s been officially slain!", at: 0 },
    { body: "Catch y’all next time when I bring the pain!", at: 0 },
    {
      body: "Punchline pandemonium, I’m ownin’ this sodium, explodin’ your podium, you’re chokin’ on odium!",
      at: 0,
    },
    { body: "I’m barkin’ these rhymes, you’re just a lap dog!", at: 0 },
    { body: "You’re flexin’ online, but your clout’s on mute!", at: 0 },
    { body: "I’m shreddin’ this stage, you’re sour like fruit!", at: 0 },
    {
      body: "Freestyle cataclysm, I’m rippin’ with rhythm, your schism’s a prison, you’re missin’ my prism!",
      at: 0,
    },
    { body: "I’m rollin’ this chat, you’re payin’ the price!", at: 0 },
    {
      body: "Lyric colossus, I toss this, you glossless, exhaust this, your loss is my profit’s process!",
      at: 0,
    },
    { body: "I’m buildin’ these bars like castles in sand!", at: 0 },
    { body: "Your flow’s got no spark, it’s dimmer than night!", at: 0 },
    { body: "I’m lightin’ this up, you’re losin’ the fight!", at: 0 },
    {
      body: "Freestyle flip, I’m the king of the flip-script, you slip quick like banana peels in a panic picnic!",
      at: 0,
    },
    {
      body: "Old school vibe, Rakim reborn, you corny clones get dethroned, overthrown like a pawn!",
      at: 0,
    },
    {
      body: "Eminem mode, I’m venomous, penning this genocide of your pride, your dreams get denied!",
      at: 0,
    },
    {
      body: "Punchline surgeon, dissecting your verses, inverting your curses, reimbursing the hearses!",
      at: 0,
    },
    {
      body: "Complex bars stacking like Jenga in jeopardy, your rep is a recipe for tepid mediocrity!",
      at: 0,
    },
    {
      body: "Lyricism labyrinth, you lost in the maze, amazed as I blaze trails, your fails unveiled!",
      at: 0,
    },
    {
      body: "Double entendre thunder, plunder your blunder, under the wonder, you’re sundered asunder!",
      at: 0,
    },
    {
      body: "Old-school boast, coast to coast ghostin’ your post, most roastin’ host, toasting your ghost!",
      at: 0,
    },
    {
      body: "Freestyle frenzy, envy my density, intensity immensely, you pretense-y entity!",
      at: 0,
    },
    {
      body: "Slim Shady shade, cascade of tirade, invade your parade, degrade your charade!",
      at: 0,
    },
    {
      body: "Punchline precision, incision decision, derision collision, your mission’s submission!",
      at: 0,
    },
    {
      body: "Bars so intricate, syndicate dictate, vindicate my state, you imitate, dissipate!",
      at: 0,
    },
    {
      body: "Lyric cyclone, alone on the throne, your tone overblown, dethroned and unknown!",
      at: 0,
    },
    {
      body: "Multi-syllable killer, thriller distiller, filler of chiller, pillar of iller!",
      at: 0,
    },
    {
      body: "Old-school raw, flaw in your jaw, law of the draw, saw through your flaw!",
      at: 0,
    },
    {
      body: "Freestyle flight, ignite the night, spite in sight, bite the height, tight plight!",
      at: 0,
    },
    {
      body: "Eminem-esque jest, test your vest, invest in the best, rest in distress!",
      at: 0,
    },
    {
      body: "Punchline payload, explode the code, erode your abode, reload the mode!",
      at: 0,
    },
    {
      body: "Complex scheme dream, team supreme, steam from the beam, redeem the theme!",
      at: 0,
    },
    {
      body: "Lyric leviathan, titan enlighten, frighten the bitten, written in smitten!",
      at: 0,
    },
    {
      body: "Shady-style slayer, betrayer of players, flayer of sayers, prayers to naysayers!",
      at: 0,
    },
    {
      body: "Old-school grit, split your wit, quit the bit, fit the hit, lit the pit!",
      at: 0,
    },
    {
      body: "Freestyle force, course of remorse, source of the horse, divorce your discourse!",
      at: 0,
    },
    {
      body: "Punchline pinnacle, cynical clinical, minimal whimsical, criminal inimical!",
      at: 0,
    },
    {
      body: "Bars barricade cascade, invade the brigade, degrade the charade, shade of my blade!",
      at: 0,
    },
    {
      body: "Freestyle tsunami, I’m bombin’ your army, disarmin’ your charm, you’re alarmin’ly smarmy!",
      at: 0,
    },
    {
      body: "Old-school colossus, I toss this, you glossless, exhaust this, your process is profitless!",
      at: 0,
    },
    {
      body: "Eminem wrath, I’m craftin’ a path, subtractin’ your math, you’re half of my aftermath!",
      at: 0,
    },
    {
      body: "Punchline plutonium, glowin’ and blowin’, overthrowin’ your showin’, you’re knowin’ I’m growin’!",
      at: 0,
    },
    {
      body: "Lyric labyrinthine, divine in design, malign your align, you’re resignin’ in decline!",
      at: 0,
    },
    {
      body: "Freestyle ferocity, velocity atrocity, your paucity’s a travesty, I’m masterin’ audacity!",
      at: 0,
    },
    {
      body: "Old-school vendetta, I’m better, no debtor, shredder of fetters, you’re wetter than sweaters!",
      at: 0,
    },
    {
      body: "Shady’s guillotine gleam, I scheme and redeem, you scream in a dream, I’m supreme in the theme!",
      at: 0,
    },
    {
      body: "Punchline cataclysm, schism with rhythm, prism of wisdom, you’re victim to my system!",
      at: 0,
    },
    {
      body: "Complex bars fortress, I’m heartless, you artless, depart this, my spark is your darkness!",
      at: 0,
    },
    {
      body: "Freestyle crusade, I invade and degrade, you fade in the shade, my blade’s a grenade!",
      at: 0,
    },
    {
      body: "Old-school monarch, I spark in the dark, embark on a lark, you’re shark food in my arc!",
      at: 0,
    },
    {
      body: "Eminem blitz, I split your wits, commit to the hits, you quit in the pits!",
      at: 0,
    },
    {
      body: "Punchline juggernaut, I’m hot, you’re not, forgot your spot, I rot your plot!",
      at: 0,
    },
    {
      body: "Lyric armageddon, I’m treadin’ and shreddin’, you’re dreadin’ my headin’, your beddin’s unleavened!",
      at: 0,
    },
    {
      body: "Freestyle phoenix, I rise and capsize, your lies in demise, my rhymes hypnotize!",
      at: 0,
    },
    {
      body: "Old-school dynasty, I’m crafty, you’re nasty, I blast thee, your past be a tragedy!",
      at: 0,
    },
    {
      body: "Shady’s vendetta, I shred ya, no better, you’re wetter, I letter, you’re debtor forever!",
      at: 0,
    },
    {
      body: "Punchline inferno, I burn through your journal, eternal, internal, you’re churnin’ nocturnal!",
      at: 0,
    },
    {
      body: "Complex rhyme cyclone, I’m lone on the throne, your moan’s overblown, you’re prone to my stone!",
      at: 0,
    },
    {
      body: "Freestyle vortex, I torque and extort, your retort’s a distort, I’m sportin’ a cohort!",
      at: 0,
    },
    {
      body: "Old-school titan clash, I thrash and unmask, your trash is unclass, I’m flashin’ the stash!",
      at: 0,
    },
    {
      body: "Eminem onslaught, I fought and distraught, your thought’s overwrought, I’m brought to the top!",
      at: 0,
    },
    {
      body: "Punchline maelstrom, I’m raidin’ your realm, your helm’s overwhelm, I’m welcomin’ the helm!",
      at: 0,
    },
    {
      body: "Lyric apocalypse now, I vow to endow, your bow’s a disavow, I’m plowin’ the plow!",
      at: 0,
    },
    {
      body: "Freestyle cyclone strike, I like to ignite, your fight’s a delight, I’m tight in the night!",
      at: 0,
    },
    {
      body: "Old-school crusade king, I sing and I sting, your ring’s a weak thing, I bring the bling!",
      at: 0,
    },
    {
      body: "Shady’s razor rain, I pain and I gain, your lane’s down the drain, I reign in the main!",
      at: 0,
    },
    {
      body: "Punchline supernova, I’m nova and over, your clover’s a rover, I’m sober and sober!",
      at: 0,
    },
    {
      body: "Complex bars titan, I’m writin’ and fightin’, your lightnin’s ignitin’, I’m tightenin’ the tighten!",
      at: 0,
    },
    {
      body: "Freestyle tsunami wave, I rave and I save, your cave’s a grave, I’m brave in the rave!",
      at: 0,
    },
    {
      body: "Old-school warlord, I’m scored and restored, your cord’s ignored, I’m lord of the board!",
      at: 0,
    },
    {
      body: "Eminem blitzkrieg, I rig and I dig, your fig’s a twig, I’m big in the gig!",
      at: 0,
    },
    {
      body: "Punchline avalanche, I launch and enhance, your chance is a trance, I dance in advance!",
      at: 0,
    },
    {
      body: "Lyric inferno blaze, I daze and I graze, your maze’s a phase, I’m praise in the haze!",
      at: 0,
    },
    {
      body: "Freestyle hurricane, I reign and detain, your pain’s in vain, I’m main in the mane!",
      at: 0,
    },
    {
      body: "Old-school titan roar, I soar and I score, your core’s a bore, I’m lore in the lore!",
      at: 0,
    },
    {
      body: "Shady’s venom strike, I like and I spike, your hike’s a bike, I’m mike in the mike!",
      at: 0,
    },
    {
      body: "Punchline cataclysm crash, I bash and I flash, your rash is a dash, I’m cash in the clash!",
      at: 0,
    },
    {
      body: "Complex rhyme titan, I’m fightin’ and lighten, your lighten’s a frightenin’, I’m heighten the heighten!",
      at: 0,
    },
  ];

  // Shuffle messages for variety (Fisher-Yates shuffle)
  for (let i = messages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [messages[i], messages[j]] = [messages[j], messages[i]];
  }

  // Cap the number of messages to maxLines
  messages = messages.slice(0, maxLines);

  // Adjust timings to sequential delayMs intervals after shuffle
  messages.forEach((m, index) => {
    m.at = index * delayMs;
  });

  // Helper to send a single message, with FB-compatible mention
  const send = async (msg) => {
    let messageBody = msg.body;
    if (targetId && targetName) {
      // Use FB-compatible mention format
      const mention = { tag: `@${targetName}`, id: targetId };
      messageBody = `@${targetName} ${msg.body}`;
      try {
        await api.sendMessage(
          { body: messageBody, mentions: [mention] },
          threadID
        );
      } catch (error) {
        console.error("Error sending message:", error);
        await api.sendMessage(
          `Yo, FB’s actin’ up, but the bars keep droppin’! ${msg.body}`,
          threadID
        );
      }
    } else {
      try {
        await api.sendMessage(messageBody, threadID);
      } catch (error) {
        console.error("Error sending message:", error);
        await api.sendMessage(
          `Yo, FB’s actin’ up, but the bars keep droppin’! ${msg.body}`,
          threadID
        );
      }
    }
  };

  // Schedule the messages
  const start = Date.now();
  for (const m of messages) {
    const delay = Math.max(0, m.at - (Date.now() - start));
    setTimeout(() => {
      send({ body: m.body });
    }, delay);
  }
};
