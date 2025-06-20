const express=require("express");
const socket=require("socket.io");
const app=express();
const http=require("http");
const {Chess} = require("chess.js")
const path=require("path")
const userModel=require("./models/usermodel")
const jwt=require("jsonwebtoken")
const bcrypt = require("bcrypt");
const cookie=require("cookie")

const {generateToken}=require("./utils/generateToken")


require("dotenv").config();
const cookieParser=require("cookie-parser")
const db=require("./config/mongooseconnection");


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const session = require("express-session");
const flash = require("connect-flash");
const isLoggedIn = require("./middlewares/isLoggedIn");

// Setup session middleware
app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET || "secretKey",
    resave: false,
    saveUninitialized: false,
}));

// Setup flash middleware
app.use(flash());


const server=http.createServer(app);

const io=socket(server);

const chess=new Chess();
let players={};
let currentPlayer="w";


let moveTimer = null;
const MOVE_TIME_LIMIT = 30 * 1000;



function startMoveTimer() {
    clearTimeout(moveTimer);
    let timeLeft = MOVE_TIME_LIMIT / 1000;

    io.emit("timerTick", { timeLeft });

    moveTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(moveTimer);
            const turn = chess.turn();
            let loserRole = turn === 'w' ? 'white' : 'black';

            io.emit("timeOut", loserRole);{
            
            chess.reset();}
            io.emit("boardState", chess.fen());
        } else {
            io.emit("timerTick", { timeLeft });
        }
    }, 1000);

}

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))

app.get("/",function(req,res){
    // res.render("index",{title:"Chess Game"});
    res.render("login",{success: req.flash("success"),error: req.flash("error"),title:"Chess Game"})
})



app.post("/register",async function(req,res){
    try{
    let {email,password,fullname}=req.body;

    let users=await userModel.findOne({email});
    if(users){
     req.flash("error", "User already exist");
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
        req.flash("success", "Registration successfull");
        let token=generateToken(user);
        res.cookie("token",token);
        res.redirect("/home");
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
     req.flash("error", "Incorrect email or password");
     return res.redirect("/");
    }
    
    bcrypt.compare(password,user.password,function(err,result){

    if(!result)  

    {    
    req.flash("error", "Incorrect email or password");
    return res.redirect("/");
    }
    else{
    req.flash("success", "You are logged in successfully");
    let token=generateToken(user);
    res.cookie("token",token);
    res.redirect("/home");

    }

    })
});


app.get("/home",isLoggedIn,async function(req,res){

    const user = await userModel.findById(req.user);

    // console.log(user.fullname)
    res.render("index",{success: req.flash("success"),
    error: req.flash("error"),title:"Chess Game",username:user.fullname,userStats: { wins: user.wins, losses: user.losses ,moveHistory: user.moveHistory || []}});
})

app.get("/logout",async function(req,res){
    res.clearCookie("token");
    res.redirect("/")
})

app.get("/profile",isLoggedIn,async function(req,res){

    const user = await userModel.findById(req.user);
    res.render("profile",{user});
})

app.get("/dashboard", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user);

  console.log(user);
  res.render("dashboard",  {user: {
            fullname: user.fullname,
            email: user.email,
            wins: user.wins,
            losses: user.losses,
            moveHistory: user.moveHistory || [],
        }});
});





io.on("connection",async function(uniquesocket){
    
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

    
    
        const rawCookie = uniquesocket.handshake?.headers?.cookie;
        if (!rawCookie) throw new Error("No cookie found");

        const parsed = cookie.parse(rawCookie);
        const token = parsed.token;
        if (!token) throw new Error("Token not found in cookie");

        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.id;

        const user = await userModel.findById(userId);
        if (!user) throw new Error("User not found");

    
        uniquesocket.emit("boardState", chess.fen())

    

       if (players.white && players.black) {
        io.emit("gameStart");
        startMoveTimer();

    // Clear move history only when game starts (not on refresh or reconnect)
    [players.white, players.black].forEach(async (id) => {
        const socket = io.sockets.sockets.get(id);
        if (!socket) return;

        
    });
} else {
    io.emit("waitForPlayer");
}

   
    
    
    uniquesocket.data.username = user.fullname;
    

  uniquesocket.on("chatMessage", ({ message }) => {
    const sender = uniquesocket.data.username;
    // io.emit("chatMessage", { message, sender });

     [players.white, players.black].forEach((id) => {
    const playerSocket = io.sockets.sockets.get(id);
    if (playerSocket) {
      playerSocket.emit("chatMessage", { message, sender });
    }
  });
  });
   

    uniquesocket.on("disconnect",async function(){
        if(uniquesocket.id===players.white ){
            delete players.white;
        }
        else if(uniquesocket.id===players.black ){
            delete players.black;
        }



        try {
            
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            const user = await userModel.findById(decoded.id);

            if (user) {
                user.moveHistory = [];
                await user.save();
                socket.emit("moveHistory", []); // Clear it on frontend too
            }
        } catch (err) {
            console.error("Error clearing move history at game start:", err.message);
        }
    });


    uniquesocket.on("move",async function(move){
        try{
            if(chess.turn()==='w' && uniquesocket.id!==players.white) return;
            /*players.white me id h us user ki jiska color white hai */
            if(chess.turn()==='b' && uniquesocket.id!==players.black) return;      /*jiski turn hai whi chl skte h move*/

            const result=chess.move(move);

            if(result){
                currentPlayer=chess.turn();    /*gives you the player who now has the turn, after the previous player made a valid move.*/         
                /*since internally the turn has been updated by the chess.js so in currentplayer we simply store the next turn*/
                io.emit("move",result);
                io.emit("boardState",chess.fen())   /* FEN-tell us the current stage of board , its a long equation*/

                startMoveTimer()

                
                const decoded = jwt.verify(token, process.env.JWT_KEY);


                const user = await userModel.findById(decoded.id);
                    if (user) {
                        console.log("Saving move:", result.san); 
                        user.moveHistory.push(result.san); // use move.san for standard notation
                        await user.save();
                    }
                    
                    if (winnerId === players.white) {
                    await userModel.findByIdAndUpdate(whiteUserId, { $inc: { wins: 1 } });
                    await userModel.findByIdAndUpdate(blackUserId, { $inc: { losses: 1 } });
                    }         





            }else{
                console.log("Invalid move : ",move);
                uniquesocket.emit("Invalid Move",move)
            }

            uniquesocket.on("disconnect",function(){
                let leftPlayer=null;
                if(uniquesocket.id==players.white)
                {
                    leftPlayer="white";
                    leftPlayer=uniquesocket.id;
                    delete players.white;
                }

                else if(uniquesocket.id==players.black)
                {
                    leftPlayer="black";
                    delete players.black;
                }
                if(leftPlayer){


                    chess.reset();
                    players={};
                    currentPlayer="w";

                io.emit("playerLeft", `${leftPlayer} player has left the game.`);
                io.emit("boardState", chess.fen());
                }
            })


            


        }
        catch(err){
            console.log(err);
            uniquesocket.emit("Invalid move",move)
        }
    })

    
})




server.listen(3000,function(){
    console.log("hey its workingng");
});   