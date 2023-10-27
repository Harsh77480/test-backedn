const mongoose = require('mongoose');
const connectDB = async()=>{
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser : true,
            useUnifiedTopology : true
        })
    }catch(error){
        // console.log("ERROR : " ,error);
        process.exit();
    }
};

module.exports = connectDB;