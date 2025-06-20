const mongoose=require('mongoose');



const userSchema=mongoose.Schema({
    fullname:{
        type:String,
        minLength:3,
        trim:true,

    },
    email:String,
    password:String,
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    moveHistory:[
        {
            type:String
        }
    ]
    


});

module.exports=mongoose.model("user",userSchema);