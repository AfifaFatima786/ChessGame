const express=require("express");
const socket=require("socket.io");
const http=require("http");
const {Chess} = require("chess.js")
const path=require("path")

const app=express();
const server=http.createServer(app);

const io=socket(server);
/*ek hamara express ka server hai aur ek http ka server hai jo express pe based hai, socket io http ke server pe chlega na ki express ke to hm ek server create krege http ka jo ki express k server pe based hoga, also y dono servers apas me connected honge*/

const chess=new Chess();
let players={};
let currentPlayer="W";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))

app.get("/",function(req,res){
    res.render("index",{title:"Chess Game"});
})

io.on("connection",function(uniquesocket){
    console.log("connected");


    uniquesocket.on("disconnect",function(){  
        console.log("disconnected") 
    })
})




server.listen(3000,function(){
    console.log("hey its working");
});