// textpro.js — TextPro Universal Generator

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const CACHE_DIR = path.join(__dirname, "cache");

const styles = require("../../data/textprostyles");


const API_KEY = process.env.TEXTPRO_KEY || "829cf024";

const API_BASE = "https://api.andaraz.com/api/textpro";


module.exports.config = {

    name: "textpro",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "MrDeveloper",
    usePrefix: true,

    description:
        "Generate TextPro style logos",

    commandCategory:
        "Logos",

    usages:
        "textpro <style> <text>",

    cooldowns: 5

};



module.exports.run = async function({
    api,
    event,
    args
}) {


const {
    threadID,
    messageID
}=event;



try {


await fs.mkdirp(CACHE_DIR);



if(!args[0]){


return api.sendMessage(

`❌ Please select a style.

Example:
textpro galaxy Mr Dev

Available Styles:
${styles.join(", ")}`,

threadID,
messageID

);


}



let style=args.shift();


if(!styles.includes(style)){


return api.sendMessage(

`❌ Invalid TextPro style.

Available:
${styles.join(", ")}`,

threadID,
messageID

);


}



let text=args.join(" ").trim();



if(!text){


return api.sendMessage(

"❌ Please provide text.\nExample: textpro galaxy Mr Dev",

threadID,
messageID

);


}




api.sendMessage(

"🖤🍀 Creating TextPro Logo... Please wait 🍀🖤",

threadID

);





const apiURL =
`${API_BASE}/${style}?apikey=${API_KEY}&nama=${encodeURIComponent(text)}`;



// Get JSON response

const result = await axios.get(apiURL,{
timeout:20000,
headers:{
"User-Agent":"MrDevBot/2.0",
Accept:"application/json"
}
});



if(
!result.data ||
!result.data.status ||
!result.data.data ||
!result.data.data.url
){


return api.sendMessage(

`❌ Logo generation failed.

${result.data.message || "Unknown error"}`,

threadID,
messageID

);


}




const imageURL =
result.data.data.url;





// Fetch image

const image = await axios.get(
imageURL,
{

responseType:"arraybuffer",

timeout:30000,

headers:{


"User-Agent":
"Mozilla/5.0",

"Referer":
"https://textpro.me/",

"Accept":
"image/avif,image/webp,image/apng,image/*,*/*"

}

});





const file =
path.join(
CACHE_DIR,
`textpro_${Date.now()}.jpg`
);



await fs.writeFile(
file,
Buffer.from(image.data)
);





api.sendMessage(

{

body:

`🖤🍀 Your TextPro Logo

Style:
${style}

Credit:
Mr Developer`,

attachment:
fs.createReadStream(file)

},

threadID,

(err)=>{


fs.unlink(file)
.catch(()=>{});


if(err)
console.log(err);


},

messageID

);



}
catch(err){


console.log(
"[textpro error]",
err.message
);



if(err.response){


return api.sendMessage(

`❌ API Error

${err.response.data?.message || err.response.status}`,

threadID,
messageID

);


}



return api.sendMessage(

"❌ Failed generating logo.",

threadID,
messageID

);


}



};