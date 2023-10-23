const express = require('express');
const app = express();


app.get('/api',(req,res)=>{
    res.send("hi");
})

const server = app.listen(5000,()=>{
    console.log("running");
});

const io = require('socket.io')(server,{
    pingTimeout : 60000,                    //close the connection 
    cors : {
        origin : "http://localhost:5173",
    }
});

io.on("connection" ,(socket)=>{
    socket.join(socket.id);//join self room
    socket.on("join room",(data)=>{ // user is ready to join a room 
        socket.join(data.roomCode);//join user in input code 
        socket.emit("ROOM JOINED",data.roomCode);//acknowledgement for joining 
    });
    let playerId = 0;//players whose turn is 
    let currWord = '';
    const getRoundData = (playerId,currWord) => { //this will run player whose turn is currently going on 
        if(playerId !== socket.id){ //emited roundData to that player so that he can broadcast it to all players backends and start drawing currWord
            socket.to(playerId).emit("getRoundData",[playerId,currWord]);
        }else{
            socket.emit("getRoundData",[playerId,currWord]);
        }
    }
    socket.on("setRoundData",(data)=>{//set current Round data for other players 
        try{
            playerId = data[0];
            currWord = data[1];
        }catch{
        }
    })
    const game = (roomCode)=>{ //this function will run for user that clicked start 
        try{
            let words = ['corrot','dragon','windmill','peacock','tiger','fireman','rocket'];
            let users = [...io.sockets.adapter.rooms.get(roomCode)];
            let playerIndex = 0;
            // console.log(users);
            socket.emit("Game", "Game Started");socket.to(roomCode).emit("Game", "Game Started");
            playerId = users[0];
            socket.emit("Game", "ROUND : " + 1);socket.to(roomCode).emit("Game", "ROUND : " + 1);
            socket.emit("Game", `player ${playerIndex} is drawing`);socket.to(roomCode).emit("Game", `player ${playerIndex} is drawing`);
            getRoundData(playerId,words[playerIndex]);
            let round = 2;
            const roundInterval = setInterval(() => {
            playerIndex = (playerIndex + 1) % users.length;playerId = users[playerIndex];
            socket.to(roomCode).emit("Game", "ROUND : " + round);socket.emit("Game", "ROUND : " + round); 
            socket.emit("Game", `player ${playerIndex} is drawing`);socket.to(roomCode).emit("Game", `player ${playerIndex} is drawing`);    
            getRoundData(playerId,words[playerIndex]);
            round++;//increase round after given interval 
            }, 10000);   
            setTimeout(()=> {
            socket.to(roomCode).emit("Game", "Game Finished");//leave room acknowledgement
            socket.emit("Game","Game Finished");//for self
            clearInterval(roundInterval); 
            }, users.length * 10000 ); // set it to totalplayers * 10000 (2 games of 30 sec to each player)
            }
            catch(error){
                socket.emit("Game","Internal Server Error");
            }

    }


    socket.on("start", (data)=>{
        try{
            if( socket.rooms.has(data.roomCode) ) {
                game(data.roomCode);//start the game 
            }
        }catch{
            socket.emit("Game","Internal Server Error,ReJoin");
        }

    } )

    socket.on("message",(data)=>{
         if( socket.rooms.has(data.roomCode) ) { //only broadcast if in room 
            if(socket.id != playerId){
             socket.to(data.roomCode).emit("broadcast",data.message);
             socket.emit("broadcast",data.message);//for self 
            }
         }
    });

    socket.on("draw",(data)=>{
        try{
            if(data.message instanceof Buffer){
                if (data.message.length <= 100 * 1024) { //allow only 100kb 
                    if( socket.rooms.has(data.roomCode)) { //only broadcast if in room 
                        socket.to(data.roomCode).emit("broadcast",data.message);
                        socket.emit("broadcast",data.message);//for self 
                    }
                }
                else{
                }
            }else{
            }

        }
        catch{
            socket.emit("Game","Internal Server Error");
        }
    })
})


