const express=require("express");
const socket=require("socket.io");
const http=require("http");
const {Chess} = require("chess.js")
const path=require("path")

const app=express();
const server=http.createServer(app);

const io=socket(server);

const chess=new Chess();
let players={};
let currentPlayer="w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))

app.get("/",function(req,res){
    res.render("index",{title:"Chess Game"});
})

io.on("connection",function(uniquesocket){
    console.log("connected");

    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w")
    }
    else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b")
    }else{
        uniquesocket.emit("spectatorRole")
    }


    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id===players.white ){
            delete players.white;
        }
        else if(uniquesocket.id===players.black ){
            delete players.black;
        }
    });


    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn()==='w' && uniquesocket.id!==players.white) return;
            /*players.white me id h us user ki jiska color white hai */
            if(chess.turn()==='b' && uniquesocket.id!==players.black) return;      /*jiski turn hai whi chl skte h move*/

            const result=chess.move(move);

            if(result){
                currentPlayer=chess.turn();    /*gives you the player who now has the turn, after the previous player made a valid move.*/         
                /*since internally the turn has been updated by the chess.js so in currentplayer we simply store the next turn*/
                io.emit("move",move);
                io.emit("boardState",chess.fen())   /* FEN-tell us the current stage of board , its a long equation*/
            }else{
                console.log("Invalid move : ",move);
                uniquesocket.emit("Invalid Move",move)
            }


        }
        catch(err){
            console.log(err);
            uniquesocket.emit("Invalid move",move)
        }
    })
})




server.listen(3000,function(){
    console.log("hey its working");
});