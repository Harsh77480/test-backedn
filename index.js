const express = require('express');
const app = express();
const dotenv = require('dotenv');

dotenv.config();
const connectDB = require('./src/config/db');
connectDB();
app.use(express.json());
const userRouter = require('./src/routes/user');
app.use('/user', userRouter); 





//error handling 
const {notFound,errorHandler} = require("./src/middleware/error.js");
const { get } = require('mongoose');
app.use(notFound);
app.use(errorHandler);


const port = process.env.PORT || 3000;


const server = app.listen(port,()=>{
    console.log("running " + port);
});

const io = require('socket.io')(server,{
    pingTimeout : 60000,                    //close the connection 
    cors : {
        origin : "http://localhost:5173",
    }
});

require('./ws')(io);