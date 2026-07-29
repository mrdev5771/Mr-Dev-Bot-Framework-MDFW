// randomdp.js
// Random HD Profile Pictures using RandomUser API

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


const CACHE_DIR =
    path.join(__dirname, "cache");



module.exports.config = {

    name: "randomdp",

    version: "2.0.0",

    hasPermssion: 0,

    credits: "MrDeveloper",

    description:
        "Get random high quality male/female profile pictures",

    usePrefix: true,

    commandCategory: "image",

    usages:
        "randomdp [male/female]",

    cooldowns: 5

};



function getGender(args){

    if(!args || !args[0])
        return "";


    const gender =
        args[0].toLowerCase();


    if(
        gender === "male" ||
        gender === "m"
    )
        return "male";


    if(
        gender === "female" ||
        gender === "f"
    )
        return "female";


    return "";

}




module.exports.run = async function({
    api,
    event,
    args
}){


    const {
        threadID,
        messageID
    } = event;



    try {


        await fs.ensureDir(
            CACHE_DIR
        );


        const gender =
            getGender(args);



        const apiURL =
            `https://randomuser.me/api/?inc=name,picture${gender ? `&gender=${gender}` : ""}`;



        const response =
            await axios.get(
                apiURL,
                {
                    timeout:15000
                }
            );



        const user =
            response.data.results[0];



        if(!user)
            throw new Error(
                "No image found"
            );



        const imageURL =
            user.picture.large;



        const name =
            `${user.name.first}`;



        const file =
            path.join(
                CACHE_DIR,
                `dp_${Date.now()}.jpg`
            );



        const image =
            await axios.get(
                imageURL,
                {
                    responseType:"arraybuffer",
                    timeout:15000
                }
            );



        await fs.writeFile(
            file,
            image.data
        );



        await api.sendMessage(

            {
                body:

`🖤✨ RANDOM PROFILE IMAGE ✨🖤

👤 Name: ${name}

${gender ?
`🎭 Gender: ${gender}` :
"🎲 Gender: Random"}

🔥 Quality: HD

Credit: MrDeveloper </>`,

                attachment:
                    fs.createReadStream(file)

            },

            threadID,

            () => {

                fs.unlink(file)
                .catch(()=>{});

            },

            messageID

        );



    }


    catch(error){


        console.error(
            "[randomdp error]",
            error.message
        );



        return api.sendMessage(

`❌ Failed to fetch profile image.

Try:
• randomdp
• randomdp male
• randomdp female`,

            threadID,
            messageID

        );

    }

};