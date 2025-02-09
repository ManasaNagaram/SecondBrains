 import mongoose, {model,mongo,Schema} from "mongoose";
 import {DB_URL} from "./config";
import dotenv from "dotenv";
dotenv.config();

async function connectTodb(){
    await mongoose.connect(DB_URL);
}
connectTodb();

const UserSchema = new Schema({
    username:{type:String , unique :true,require:true},
    password :{type:String , unique :true,require:true},
})

export const User = model("User",UserSchema);

const ContentSchema = new mongoose.Schema({
    title:String,
    link:String,
    tags :[{type:mongoose.Schema.Types.ObjectId,ref:"Tag"}],
    userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
})

export const Content = model("Content",ContentSchema);

const TagSchema = new mongoose.Schema({
    tagname:String
})
export const Tag = model("Tag",TagSchema);