const { disconnect } = require("mongoose");
const jwt = require('jsonwebtoken');
// require 
const user = require("./src/models/user");
const newGame = require("./src/models/game");

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true });

module.exports = function (io) {
try{

    io.on("connection" , async (socket)=>{
        try{
            let clearRecord = async (userCode,userName )=>{
                const gameExist =  await newGame.findOne({code:userCode});
                if(!gameExist){return 1;}
                // const message = userName?`${userName} left`:'it was not started in 1 min';
                const sockets = await io.in(userCode).fetchSockets(); //remove everyone from room
                sockets.forEach(s => {
                    // s.emit( "error" ,`game is ended because ${message}`);
                    s.leave(userCode);
                });
                await newGame.deleteOne({code : userCode});//delete the contest 
                const x = await user.updateMany( {contest : userCode} ,{contest : ""});
                return 0;
            };

            const token = socket.handshake.query.token;  // sanitize token 
            let Code = socket.handshake.query.gameCode;// sanitize gameCode 
            const decoded = jwt.verify(token,process.env.JWT_SECRET); //
            user.findById(decoded.id).select("-password").then( async (User)=>{

                if(User){ // all socket code starts 

                    const userCode = User.contest;
                    // console.log(User.contest);
                    
                    if(userCode){
                        const cleared = await clearRecord(userCode,User.name); 
                        if(cleared){
                            //uncomment for error detection 
                            // console.log("game dont exist");
                            socket.emit("error","game dont exist")
                            return ;
                        }
                    }

                    //
                    if(Code){//create new 
                        const existingContest = await newGame.findOne({code : Code});
                        if(existingContest){
                            if(existingContest.status != 'new'){
                                socket.emit("error","This game was already started");
                                return ;
                            }
                            await user.findById(decoded.id).updateOne({contest : Code,score : 0});
                            socket.join(Code);
                            socket.emit("joined",Code);
                            // console.log("entered existing contest ",Code);
                            
                        }else{
                            // console.log("no such room");
                            socket.emit("error","no such room");
                            return ;
                        }
                    }else{
                        
                        const newContest = await newGame.create({});
                        await user.findById(decoded.id).updateOne({contest : newContest.code,score : 0});
                        socket.join(newContest.code);
                        socket.emit("joined",newContest.code);
                        //uncomment for error detection 
                        // console.log("created new room", newContest.code);

                        // setTimeout(()=>{
                        //  clearRecord(newContest.code);
                        // },60000);
                    }
                    
                    const gameMessage=(code,message)=>{
                        if(code == socket.id){socket.emit("game",message);return;}
                        if(code.length <= 5){socket.emit("game",message);}
                        socket.to(code).emit("game",message);
                    }
                    var dontRepeat = '';
                    socket.on("message",async(data)=>{
                        if( socket.rooms.has(data.roomCode) ) { //only broadcast if in room 
                            // console.log(data);
                            const game = await newGame.findOne({code : data.roomCode});
                            // console.log(game);
                            if(socket.id != game.currPlayer){
                            //if message matches with current word then emit("Game","Right Answer +1 point")
                            //  socket.to(data.roomCode).emit("broadcast",data.message);
                            //  socket.emit("broadcast",data.message);//for self 
                                gameMessage(game.currPlayer, ` ${User.name} Thinks its ${data.message} `);
                                if(data.message === game.currWord){
                                    if(dontRepeat != game.currRound){
                                        // await user.findOne(contest)
                                        const thisUser = await user.findById(decoded.id);
                                        await user.findById(decoded.id).updateOne({score : thisUser.score + 1});
                                        gameMessage(socket.id,"Correct Answer");
                                        dontRepeat = game.currRound;
                                    }
                                    else{
                                        gameMessage(socket.id,"You Already Gave Correct Answer");
                                    }
                                }else{
                                    gameMessage(socket.id,"Wrong Answer");
                                }
                            }else{
                                gameMessage(socket.id,"You are Drawing you cannot Answer");
                            }

                            

                            }
                    });

                    socket.on("draw",(data)=>{
                        // console.log("drew");
                            try{
                                if(data.message instanceof Buffer){
                                    if (data.message.length <= 100 * 1024) { //allow only 100kb 
                                        if( socket.rooms.has(data.roomCode)) { //only broadcast if in room 
                                            socket.to(data.roomCode).emit("broadcast",data.message);
                                            socket.emit("broadcast",data.message);//for self 
                                        }
                                    }
                                    else{
                                        emit("error","data too large");
                                    }
                                }else{
                                    emit("error","wrong data format");
                                }
                            }
                            catch{
                                socket.emit("Game","Internal Server Error");
                            }
                            
                        });


                        

                        function game(Code , Size){
                            return new Promise( async(resolve,reject)=>{

                        // const exec = async  (Code,Size) =>{ //

                            gameMessage(Code,"Game Started");
                            const clients = await io.sockets.adapter.rooms.get(Code);
                            const players = [...clients]
                            let words = ['corrot','dragon','windmill','peacock','tiger','fireman','rocket'];
                            let ind = 0;let round = 1;
                            // players++;


                            //round 1
                            let currWord = words[ind];
                            gameMessage(Code,"ROUND : " + round);
                            gameMessage(players[ind],"Its your Turn Draw : " + currWord);
                            const res = await newGame.updateOne({code : Code},{currPlayer : players[ind] , currWord : words[ind] , currRound : round })
                            round++;

                            const roundTimer = setInterval(async ()=>{

                                //inCheck
                                const ifRoom = await io.sockets.adapter.rooms.get(Code);
                                if(!ifRoom || ifRoom.size != Size){
                                    clearInterval(roundTimer);
                                    socket.emit("error","game ended because a player left");
                                    reject('');
                                }


                                //round
                                ind = (ind + 1) % Size;
                                currWord = words[ind];
                                gameMessage(Code,"ROUND : " + round + " Guess The Drawing");
                                gameMessage(players[ind],"Its your Turn Draw : " + currWord);
                                const res = await newGame.updateOne({code : Code},{currPlayer : players[ind] , currWord : words[ind] , currRound : round })
                                // console.log(res);


                                //outCheck 
                                if(round > 2*Size){ clearInterval(roundTimer); resolve();}

                                round++;
                            } ,  30000 );

                                
                        
                            } 
                          );}

                        socket.on("gameOn",async(code)=>{ //sanitize code 

                            const runningGame = await newGame.findOne({code : code});
                            if(runningGame && runningGame.status == 'new' && socket.rooms.has(code)){
                                const clients = await io.sockets.adapter.rooms.get(code).size;
                                // console.log(clients);
                                
                                if(clients >= 2 && clients <= 5 ){
                                    await newGame.updateOne({code : code},{status : 'started'});
                                    game(code , clients).then(async ()=>{

                                        const maxScore = await user.find({contest : code}).sort({score:-1}).limit(1);
                                        // console.log(maxScore[0].score);
                                        const winners = await user.find({score : maxScore[0].score , contest : code},"name");
                                        // console.log(winners);
                                        let FinalMessage = "Game Ended , ";
                                        if(winners.length > 1){FinalMessage += "Draw between ";}
                                        else{FinalMessage += "Winner is "}
                                        winners.forEach((e)=>{
                                            FinalMessage += e.name + " ";
                                        })
                                        
                                        gameMessage(code,FinalMessage);

                                    }).catch((err)=>{
                                        // console.log(err);
                                        socket.emit("error","Contest ended player left");
                                        socket.to(code).emit("error","Contest ended player left");
                                    }).finally(()=>{

                                        clearRecord(code);

                                    });


                                    //result , also check size if less then show error 
                                    // console.log("d");

                                }else{
                                    socket.emit("game","Atleast Two Players Required to start game");
                                }
                            }else{
                                socket.emit("error","Game cannot be started now");
                            }
                        })


                        socket.on("disconnect",async()=>{
                            socket.to(Code).emit("error","A User has left the Game(This will affect started Game)");
                        })

                }
            })

        }catch(err){
            // console.log(err);
        }

    
})

}
catch(error){
}
}
//volatile 

