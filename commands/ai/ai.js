const AIManager =
require("../../core/ai/AIManager");


const CooldownManager =
require("../../core/ai/CooldownManager");


module.exports.config = {

name:"ai",
version:"2.0",
hasPermssion:0,
credits:"MrDeveloper",
description:"Mr Dev AI",
usePrefix:true,
commandCategory:"AI",
usages:"ai <message>",
cooldowns:5

};



module.exports.run =
async function({api,event,args}){


const {
threadID,
messageID,
senderID
}=event;



const message =
args.join(" ");



if(!message){

return api.sendMessage(
"Talk to me first 😂",
threadID,
messageID
);

}



const cd =
CooldownManager.check(
senderID,
5
);



if(!cd.allowed){

return api.sendMessage(

`Bro slow down 😂 my brain needs ${cd.remaining}s loading time.`,

threadID,
messageID

);

}



try{


const reply =
await AIManager.chat(
senderID,
message
);



api.sendMessage(

reply,

threadID,

messageID

);



}
catch(err){

console.log(
"[AI Command]",
err
);


api.sendMessage(
"💀 AI crashed.",
threadID,
messageID
);


}


};