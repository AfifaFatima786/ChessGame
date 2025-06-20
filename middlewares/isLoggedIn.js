const jwt=require('jsonwebtoken')
const userModel=require("../models/usermodel")

async function isLoggedIn(req, res, next) {
    if(!req?.cookies?.token){
        req.flash("error","you need to be logged in first");
        return res.redirect("/");
    }
    try{
        let decoded=jwt.verify(req.cookies.token,process.env.JWT_KEY);
        let user=await userModel.findOne({email:decoded.email}).select("-password")

        req.user=user;
        next();
    } catch(err){
        req.flash("error","Something went wrong");
        res.redirect("/");
    }
}

module.exports = isLoggedIn;