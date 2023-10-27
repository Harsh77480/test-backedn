

const express = require('express');
const router = express.Router();
const { userSignIn ,userLogIn } = require('../controllers/user');  
const verifyToken = require('../middleware/auth');


router.post('/register', userSignIn); 
router.post('/login', userLogIn); 



module.exports = router;

