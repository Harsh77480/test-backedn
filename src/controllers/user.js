
const asyncHandler  = require('express-async-handler');
const User = require('../models/user');
const generateToken = require('../config/generateToken');

const userSignIn = asyncHandler(async (req,res)=>{

    try{
        const {name,email,password} = req.body;

        if(!name || !email || !password ){
            res.status(400);
            throw new Error("Please Enter All Fields");
        }

        const userExist = await User.findOne({email});
        if(userExist){
            res.status(400);
            throw new Error("User Already Exist!");
        }
        const user = await User.create({
            name,
            email,
            password
        });

        if(user){
            res.status(200).json({
                _id : user.id,
                name : user.name ,
                email : user.email,
                token : generateToken(user.id)
            })
        }
        else {
            res.status(400);
            throw new Error("Failed to Create New User");
        }
    }catch(error){
        res.status(400);
        throw new Error(error);
    }

});


const userLogIn = asyncHandler(async (req,res)=>{

    try{
        const {email,password} = req.body;

        // console.log(email,password);
        if( !email || !password ){
            res.status(400);
            throw new Error("Please Enter All Fields");
        }
        const user = await User.findOne({email});

        if(user && user.password == password){
            res.status(200).json({
                _id : user.id,
                name : user.name ,
                email : user.email,
                token : generateToken(user.id)
            })
        }
        else {
            res.status(400);
            throw new Error("Wrong Credentials");
        }
    }catch(error){
        res.status(400);
        // console.log(error);
        throw new Error("Credentials Error");
    }

});


module.exports = {userSignIn,userLogIn};