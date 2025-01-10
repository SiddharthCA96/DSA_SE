import mongoose from "mongoose";

//connnect to mongodb

mongoose.connect('mongodb+srv://ss6156852:ZCUwQ7HGO2u7IJjm@cluster0.sr1uz.mongodb.net/DSA_SE');
console.log("db connected");


//define the schemas

//user schema
const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minLength:3,
        maxLength:30
    },
    password:{
        type:String,
        required:true,
        minLength:3
    },
    firstName:{
        type:String,
        required:true,
        trim:true,
        maxLength:30,
    },
    lastName:{
        type:String,
        required:true,
        trim:true,
        maxLength:30,
    },
});

//create the user model
export const User=mongoose.model('User',UserSchema);


