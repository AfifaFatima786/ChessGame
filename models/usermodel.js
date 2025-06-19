const mongoose=require('mongoose');



const userSchema=mongoose.mongoose.Schema({
    fullname:{
        type:String,
        minLength:3,
        trim:true,

    },
    email:String,
    password:String,
    


});

module.exports=mongoose.model("user",userSchema);