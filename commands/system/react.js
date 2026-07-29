/**
 * commands/events/autoreactv2.js
 *
 * Mr Dev Framework v2 compatible
 *
 * Features:
 * - Automatic message reactions
 * - Emoji reactions
 * - Mood detection
 * - Joke/insult detection
 * - Spam protection
 */


const reactedMessages = new Set();

const cooldownMap = new Map();

const REACT_COOLDOWN = 3000;




module.exports.config = {

    name: "autoreactv2",

    version: "2.0.0",

    hasPermssion: 0,

    credits: "Mr Dev",

    usePrefix: false,

    description: "Automatic message reaction system",

    commandCategory: "no prefix",

    cooldowns: 0

};





// ================================
// Reaction Helper
// ================================


function react(api,messageID,emoji){


    try{


        api.setMessageReaction(

            emoji,

            messageID,

            (err)=>{

                if(err)

                    console.error(
                        "[autoreactv2 reaction]",
                        err
                    );

            },

            true

        );


    }
    catch(err){


        console.error(
            "[autoreactv2 react error]",
            err
        );


    }


}








// ================================
// Trigger Lists
// ================================


const emojiTriggers = new Set([

    "😋",
    "🤩",
    "🙄",
    "🤓",
    "☕",
    "🤗",
    "🤭",
    "😶",
    "🥵",
    "😎",
    "🤡",
    "😇",
    "😊",
    "🥀",
    "🥳",
    "🤔",
    "💖",
    "🙉",
    "💯",
    "🙈",
    "😏",
    "🥰",
    "😻"

]);





const sadTriggers = [

    "sad",
    ":(",
    "malungkot",
    "umay",
    "ayaw ko na",
    "gusto ko ng mamatay",
    "stress",
    "mamatay na lang ako",
    "bwesit talaga",
    "hay",
    "piste talaga",
    "arghh",
    "pota!",
    "puta!",
    "gago!",
    "nakakalungkot",
    "sakit",
    "i feel",
    "ifeel",
    "hindi na ako",
    "nakakainggit",
    "putanginang yan",
    "hayop na yan",
    "tarantado na yan",

    "😞",
    "😨",
    "😥",
    "😭",
    "😓",
    "😢",
    "😕",
    "😑",
    "😩",
    "😰",
    "😟",
    "😦"

];





const laughTriggers = [

    "bobo",
    "gago",
    "suntukan",
    "kantutin",
    "hayop",
    "hindot",
    "tangina",
    "tang ina",
    "bwesit",
    "piste",
    "argh",
    "pota",
    "puta",
    "fuckyou",
    "pakyu",
    "pakyo",
    "may bold",
    "kingina",
    "hahaha",
    "baliw",
    "bubu",
    "mabaho",
    "manyakis",
    "manyakol",
    "ambobo",
    "walang utak",
    "send bold",

    "😆",
    "😂",
    "🤣",
    "bts"

];







// ================================
// Event Handler
// ================================


module.exports.handleEvent = function({

    api,

    event,

    __GLOBAL

}){


try{


    if(!event)
        return;



    if(!event.messageID)
        return;



    const senderID =
        event.senderID;



    // ignore bot

    if(

        __GLOBAL &&
        Array.isArray(__GLOBAL.bot) &&
        __GLOBAL.bot.includes(senderID)

    )

        return;






    const body =
        String(event.body || "")
        .trim();




    if(!body)
        return;





    const messageID =
        event.messageID;




    // prevent duplicate reactions

    if(
        reactedMessages.has(messageID)
    )

        return;




    // cooldown

    const now =
        Date.now();


    const last =
        cooldownMap.get(senderID) || 0;



    if(
        now-last < REACT_COOLDOWN
    )

        return;



    cooldownMap.set(
        senderID,
        now
    );






    const text =
        body.toLowerCase();



    const first =
        body.charAt(0);





    let reaction = null;





    // ============================
    // Letter / emoji messages
    // ============================


    if(

        /[a-z]/i.test(first)

        ||

        emojiTriggers.has(first)

    ){

        reaction = "☢️";

    }






    // ============================
    // < messages
    // ============================


    else if(
        text.startsWith("<")
    ){

        reaction="🤏🏻";

    }






    // ============================
    // Hearts
    // ============================


    else if(

        (

        first==="❤" ||

        first==="❤️"

        )

    ){

        reaction="🥰";

    }







    // ============================
    // Sad messages
    // ============================


    else if(

        sadTriggers.some(
            x =>
            text.startsWith(x)
        )

    ){

        reaction="😿";

    }







    // ============================
    // Funny / insult
    // ============================


    else if(

        laughTriggers.some(
            x =>
            text.startsWith(x)
        )

    ){

        reaction="🤣";

    }






    if(reaction){


        reactedMessages.add(
            messageID
        );


        react(
            api,
            messageID,
            reaction
        );



        setTimeout(()=>{


            reactedMessages.delete(
                messageID
            );


        },60000);


    }



}
catch(err){


    console.error(
        "[autoreactv2 error]",
        err
    );


}


};







// Empty command runner

module.exports.run = function(){

    return;

};