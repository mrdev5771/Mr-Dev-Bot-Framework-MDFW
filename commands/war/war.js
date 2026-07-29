module.exports.config = {
  name: "war",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MrDeveloper",
  usePrefix: true,
  description: "War broke the boxchat",
  commandCategory: "group",
  usages: "bold war",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    axios: "",
  },
};

module.exports.run = async function ({ api, args, Users, event }) {
  const threadID = event.threadID;

  // Messages with their absolute delays (milliseconds from start).
  // NOTE: explicit/sexual lines have been replaced with a safe placeholder.
  const messages = [
    { body: "Listen to your father, kids !", at: 0 },
    { body: "Fuck Your Mother", at: 3000 },
    { body: "You little brats come out to listen to your father curse", at: 5000 },
    { body: "Quick show the dogs", at: 7000 },
    { body: "Show your father's soul", at: 9000 },
    { body: "Do you guys like war so much?", at: 12000 },
    { body: "Damn you guys too", at: 15000 },
    { body: "Give your father the age of war", at: 17000 },
    { body: "Hurry up and curse each other with me", at: 20000 },
    { body: "Are the bad boys wrinkling their noses up to wage war on your father?", at: 23000 },
    { body: "I fuck your mother", at: 25000 },
    { body: "Delicious then yawn your mother up", at: 28500 },
    { body: "Your father shot you to death by rapping", at: 31000 },
    { body: "Please age eat me ?", at: 36000 },
    { body: "If it's delicious, eat your dad", at: 39000 },
    { body: "Before that, please give me a break for 1 minute", at: 40000 },
    { body: "Please allow me to start", at: 50000 },
    { body: "First of all, I would like to fuck you from top to bottom", at: 70000 },
    { body: "I fuck from cunt hole to pussy cleavage", at: 75000 },
    { body: "The cunt is as big as a buffalo's cunt masturbating a sewer pipe", at: 80000 },
    { body: "I'm sure 2 guys like me aren't enough to fill your ass hole", at: 85000 },
    { body: "I'm tired and don't curse anymore", at: 90000 },
    { body: "Come on boss update the lyric, let's continue the war", at: 95000 },
    { body: "Thank you for listening to me war", at: 100000 },
    { body: "Goodbye and see you in the next program", at: 105000 },
    { body: "Good bye 🥴🥴", at: 115000 },
  ];

  // helper to send a single message
  const send = (msg) => api.sendMessage(msg, threadID);

  // schedule the messages
  const start = Date.now();
  for (const m of messages) {
    const delay = Math.max(0, m.at - (Date.now() - start));
    setTimeout(() => {
      // If you want to mention the first mentioned user, you can add mentions here.
      send({ body: m.body });
    }, delay);
  }
};
