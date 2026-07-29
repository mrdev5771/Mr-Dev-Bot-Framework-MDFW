/**
 * songinfo.js
 *
 * Fetch song details + lyrics
 *
 * Discord Safe Version
 *
 * Mr Dev Framework v2
 */


module.exports.config = {

    name: "songinfo",

    version: "3.1.0",

    hasPermssion: 0,

    credits: "Mr Developer + Assistant",

    description:
    "Fetch song information and lyrics",

    usePrefix: true,

    commandCategory: "music",

    usages:
    "songinfo <song name>",

    cooldowns: 5,

    dependencies:{
        axios:""
    }

};





function getAxios(){

    return (
        global?.nodemodule?.axios ||
        require("axios")
    );

}







function splitMessage(text, limit = 1800){

    const chunks = [];

    let current = "";


    for(
        const line of text.split("\n")
    ){


        if(
            (current + line).length > limit
        ){


            if(current.trim())
                chunks.push(current.trim());


            current =
            line + "\n";


        }

        else{


            current +=
            line + "\n";


        }


    }


    if(current.trim())
        chunks.push(current.trim());


    return chunks;

}








function cleanLyrics(text){


    return text


    .replace(/<[^>]*>/g,"")


    .replace(/Read More/gi,"")


    .replace(/^.*Contributors.*$/gim,"")


    .replace(/^.*Translations.*$/gim,"")


    .replace(
        /Deutsch|Русский|Türkçe|Español|Português|Polski|Italiano|Français|Nederlands|简体中文|हिन्दी|o‘zbek/gi,
        ""
    )


    .replace(
        /^.*Lyrics.*$/gim,
        ""
    )


    .trim();


}







function formatSections(text){


    return text


    .replace(
        /\[Intro\]/gi,
        "\n🎤 [Intro]"
    )


    .replace(
        /\[Verse(.*?)\]/gi,
        "\n🎶 [Verse$1]"
    )


    .replace(
        /\[Chorus(.*?)\]/gi,
        "\n🎵 [Chorus$1]"
    )


    .replace(
        /\[Bridge\]/gi,
        "\n🌉 [Bridge]"
    )


    .replace(
        /\[Outro\]/gi,
        "\n🔚 [Outro]"
    );


}









module.exports.run = async function({

    api,
    event,
    args

}){


const axios =
    getAxios();


const {

    threadID,
    messageID

}=event;




try{



    if(!args.length){


        return api.sendMessage(

            "❌ Please enter song name.\n\nExample:\nsonginfo Godzilla",

            threadID,

            messageID

        );

    }






    const query =

    encodeURIComponent(
        args.join(" ")
    );





    const url =

    `https://api.popcat.xyz/v2/lyrics?song=${query}`;



    const response =

    await axios.get(

        url,

        {
            timeout:20000
        }

    );





    const data =
        response.data;





    if(
        !data ||
        data.error ||
        !data.message
    ){


        return api.sendMessage(

            "❌ Song not found.",

            threadID,

            messageID

        );

    }







    const song =
        data.message;





    const title =
        song.title ||
        "Unknown";



    const artist =
        song.artist ||
        "Unknown";



    const genius =
        song.url ||
        "N/A";



    let lyrics =
        song.lyrics ||
        "Lyrics unavailable";





    lyrics =
        formatSections(
            cleanLyrics(
                lyrics
            )
        );







    const info =

`
🎶 SONG INFO 🎶
━━━━━━━━━━━━━━

🎵 Title:
${title}

👤 Artist:
${artist}

🔗 Genius:
${genius}

━━━━━━━━━━━━━━

📖 Lyrics:
`;







    // Send information + image

    if(song.image){


        try{


            const img =

            await axios.get(

                song.image,

                {
                    responseType:"stream",
                    timeout:15000
                }

            );



            await api.sendMessage(

                {

                    body:info,

                    attachment:
                    img.data

                },

                threadID

            );


        }

        catch(err){


            await api.sendMessage(

                info,

                threadID

            );


        }


    }

    else{


        await api.sendMessage(

            info,

            threadID

        );


    }








    const parts =

    splitMessage(

        lyrics,

        1800

    );





    for(
        const part of parts
    ){


        await api.sendMessage(

            part,

            threadID

        );


    }






}

catch(err){


    console.error(

        "[songinfo error]",

        err

    );



    return api.sendMessage(

        "❌ Failed to fetch song information.",

        threadID,

        messageID

    );


}



};