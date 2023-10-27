const jwt = require('jsonwebtoken');
const User = require('../models/user');
const asyncHandler = require("express-async-handler");

const verifyToken = asyncHandler( async (req,res,next)=>{
    
    if(req.headers && req.headers.authorization && req.headers.authorization.startsWith("Bearer") ){
    try{

            const token = req.headers.authorization.split(" ")[1];//remove word Bearer 
            const decoded = jwt.verify(token,process.env.JWT_SECRET); //verifing with secret keys 
            req.user = await User.findById(decoded.id).select("-password"); //defining a user varible inside request object (not response) for next() controller function
            next();                                                         //and assining user data from db without password column 

        }catch(error){
            res.status(401);
            throw new Error("Not Authorized,token Failed");
        }
    }else{
        res.status(401);
        throw new Error("Not Authorized,token failed");
    }

});

module.exports = verifyToken;