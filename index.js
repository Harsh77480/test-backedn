const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

// Cross Origin Protection
app.use(cors());

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});


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