const express=require("express");
const socket=require("socket.io");
const app=express();
const http=require("http");
const {Chess} = require("chess.js")
const path=require("path")
const userModel=require("./models/usermodel")
const jwt=require("jsonwebtoken")
const bcrypt = require("bcrypt");

const {generateToken}=require("./utils/generateToken")


require("dotenv").config();
const cookieParser=require("cookie-parser")
const db=require("./config/mongooseconnection");


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());



const server=http.createServer(app);

const io=socket(server);

const chess=new Chess();
let players={};
let currentPlayer="w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))

app.get("/",function(req,res){
    // res.render("index",{title:"Chess Game"});
    res.render("login")
})

app.post("/register",async function(req,res){
    try{
    let {email,password,fullname}=req.body;

    let users=await userModel.findOne({email});
    if(users){
     
     return res.redirect("/");
    } 

    bcrypt.hash(password,10,async function(err,hash){
        if(err) return res.send(err.message)
        else{
            let user=await userModel.create({
        email,
        password:hash,
        fullname
    });
        let token=generateToken(user);
        res.cookie("token",token);
        res.render("index",{title:"Chess Game"});
    }
    })
}

catch(err){
    console.log(err.message);
}
    
});

app.post("/login",async function(req,res){
    let {email,password}=req.body;

    const user=await userModel.findOne({email})
    if(!user) {
    
     return res.redirect("/");
    }
    
    bcrypt.compare(password,user.password,function(err,result){

    if(!result)  
    {    
    
    return res.redirect("/");
    }
    else{
    let token=generateToken(user);
    res.cookie("token",token);
     res.render("index",{title:"Chess Game"});

    }
    })
});


app.get("/logout",async function(req,res){
    res.clearCookie("token");
    res.redirect("/")
})

app.get("/profile",async function(req,res){

    // let user=await userModel.

    const user=await userModel.findOne({email});
    res.render("profile",{user});
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