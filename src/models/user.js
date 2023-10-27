const mongoose = require('mongoose');

const userSchema  = mongoose.Schema({

    name : {type : String,required : true},
    email : {type : String,required : true , unique : true},
    password : {type : String,required : true},
    score : {type : Number,default : 0},
    contest : {
        type : String,default : ""
    }

})


module.exports = mongoose.model("User",userSchema);
