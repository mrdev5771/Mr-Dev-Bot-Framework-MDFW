const axios = require("axios");

module.exports.config = {
    name: "quotes",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Mr Developer + Assistant",
    description: "Get random inspirational quotes",
    usePrefix: true,
    commandCategory: "fun",
    usages: "quotes",
    cooldowns: 10,
};


module.exports.run = async function ({ api, event }) {

    const {
        threadID,
        messageID
    } = event;


    try {


        const response = await axios.get(
            "https://zenquotes.io/api/random",
            {
                timeout: 10000
            }
        );


        if(
            !response.data ||
            !Array.isArray(response.data) ||
            !response.data[0]
        ){

            throw new Error(
                "Invalid API response"
            );

        }


        const quote =
            response.data[0];


        const text =
            quote.q || "Keep moving forward.";


        const author =
            quote.a || "Unknown";



        const message =

`✨ RANDOM QUOTE ✨

"${text}"

— ${author}

💫 Have a great day!`;



        return api.sendMessage(
            message,
            threadID,
            messageID
        );


    }


    catch(err){


        console.error(
            "[quotes error]",
            err.message
        );



        // fallback so command never dies

        const fallback = [

            {
                q:"Believe you can and you're halfway there.",
                a:"Theodore Roosevelt"
            },

            {
                q:"Success is not final, failure is not fatal.",
                a:"Winston Churchill"
            },

            {
                q:"Dream big and dare to fail.",
                a:"Norman Vincent Peale"
            },

            {
                q:"The future depends on what you do today.",
                a:"Mahatma Gandhi"
            }

        ];



        const random =
            fallback[
                Math.floor(
                    Math.random() * fallback.length
                )
            ];



        return api.sendMessage(

`✨ RANDOM QUOTE ✨

"${random.q}"

— ${random.a}

🌐 Offline Quote Mode`,

            threadID,
            messageID

        );

    }

};