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

//keyword schema
const all_keywordsSchema=new mongoose.Schema({
    keyword_values:String,
})

//idf schema
const idfSchema=new mongoose.Schema({
    idf_values:String,
})

//tf-idf schema
const tf_idfSchema=new mongoose.Schema({
    tf_idf_values:String,
})
//magnitude schema
const magnitudeSchema=new mongoose.Schema({
    mag_values:String,
})
//problem schema
const problemSchema=mongoose.Schema({
    problem_desc:String,
    problem_url:String,
    problem_title:String,
    problem_id:Number,
    problem_mag:Number
})
//create the  models

//user model
export const User=mongoose.model('User',UserSchema);
//keyword model
export const Db_Keyword=mongoose.model('Db_Keyword',all_keywordsSchema);
export const idf=mongoose.model('idf',idfSchema);
export const tf_idf=mongoose.model('tf_idf',tf_idfSchema);
export const Db_mag=mongoose.model('Db_mag',magnitudeSchema);
export const all_problem=mongoose.model('all_problem',all_problem);
