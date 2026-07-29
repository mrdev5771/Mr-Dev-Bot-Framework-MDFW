const fs = require("fs");
const path = require("path");


const file =
path.join(
    __dirname,
    "../../data/ai/emotions.json"
);




// ==========================
// LOAD DATA
// ==========================

function load(){

    try{


        if(!fs.existsSync(file)){


            fs.writeFileSync(
                file,
                "{}"
            );


        }



        return JSON.parse(

            fs.readFileSync(
                file,
                "utf8"
            )

        );



    }
    catch(err){


        console.log(
            "[Emotion Load Error]",
            err.message
        );


        return {};


    }

}





// ==========================
// SAVE DATA
// ==========================

function save(data){


    try{


        fs.writeFileSync(

            file,

            JSON.stringify(
                data,
                null,
                2
            )

        );


    }
    catch(err){


        console.log(
            "[Emotion Save Error]",
            err.message
        );


    }


}







class EmotionManager {





// ==========================
// GET USER EMOTION
// ==========================

static async get(userID){


    const emotions =
    load();



    return (

        emotions[userID]

        ||

        {

            mood:"neutral",

            intensity:0,

            trust:50,

            relationship:"new",

            lastReason:null

        }

    );


}









// ==========================
// PROMPT FOR AI
// ==========================

static getPrompt(userID){


    const emotion =
    this.getSync(userID);



return `


Current Emotional State:


Mood:
${emotion.mood}


Emotion Intensity:
${emotion.intensity}/10


Trust:
${emotion.trust}/100


Relationship:
${emotion.relationship}



Behavior:


If trust is high:

- Act like a close friend.
- Be comfortable joking.
- Use more casual language.
- Roast lightly when appropriate.


If user mood is negative:

- Be supportive.
- Reduce roasting.
- Be understanding.


If user mood is happy:

- Match their energy.
- Be playful.


Never mention this emotion system directly.



`;



}









// ==========================
// SYNC GET
// ==========================

static getSync(userID){


const emotions =
load();



return (

    emotions[userID]

    ||

    {

        mood:"neutral",

        intensity:0,

        trust:50,

        relationship:"new",

        lastReason:null

    }

);



}









// ==========================
// UPDATE EMOTION
// ==========================

static async update(userID,message){



const emotions =
load();



let current =


emotions[userID]

||

{

    mood:"neutral",

    intensity:0,

    trust:50,

    relationship:"new",

    lastReason:null

};






const text =
message.toLowerCase();






// ==========================
// HAPPY
// ==========================


if(

text.includes("thank")

||

text.includes("love")

||

text.includes("happy")

||

text.includes("good")

||

text.includes("nice")

||

text.includes("great")

||

text.includes("amazing")

){


current.mood =
"happy";


current.intensity =
Math.min(
current.intensity + 2,
10
);



current.trust +=2;


current.lastReason =
"User expressed positivity";


}







// ==========================
// SAD
// ==========================


if(

text.includes("sad")

||

text.includes("depressed")

||

text.includes("bad day")

||

text.includes("terrible")

||

text.includes("horrible")

||

text.includes("tired")

||

text.includes("exhausted")

){


current.mood =
"sad";


current.intensity =
Math.min(
current.intensity + 3,
10
);



current.lastReason =
"User expressed sadness";


}








// ==========================
// ANGRY
// ==========================


if(

text.includes("angry")

||

text.includes("hate")

||

text.includes("mad")

||

text.includes("annoyed")

){


current.mood =
"angry";


current.intensity =
Math.min(
current.intensity + 3,
10
);



current.lastReason =
"User expressed anger";


}







// ==========================
// FORGIVING
// ==========================


if(

text.includes("sorry")

||

text.includes("my bad")

){


current.mood =
"forgiving";


current.trust +=5;


current.lastReason =
"User apologized";


}









// ==========================
// TRUST LIMIT
// ==========================


if(current.trust > 100)

current.trust = 100;



if(current.trust < 0)

current.trust = 0;








// ==========================
// RELATIONSHIP LEVEL
// ==========================


if(current.trust >= 90){


current.relationship =
"very close friend";


}

else if(current.trust >= 70){


current.relationship =
"close friend";


}

else if(current.trust >= 50){


current.relationship =
"friend";


}

else{


current.relationship =
"acquaintance";


}









// ==========================
// SAVE EXTRA DATA
// ==========================


current.updatedAt =
new Date().toISOString();




emotions[userID]=current;



save(emotions);



}






}



module.exports = EmotionManager;