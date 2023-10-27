const mongoose = require('mongoose');

function generateRandomCode() {
    const min = 10000; // Minimum 5-digit code
    const max = 99999; // Maximum 5-digit code
    return (Math.floor(Math.random() * (max - min + 1)) + min);
  }

const gameSchema  = mongoose.Schema({
    code : {
        type: String, 
        default: generateRandomCode,
      },
    status : {type : String , default : "new"},
    players : {type : Object , default : {}},
    currPlayer : {type : String , default : ""},
    currWord  : {type : String , default : ""},  
    currRound  : {type : Number , default : 0}  


})

module.exports = mongoose.model("Game",gameSchema);
