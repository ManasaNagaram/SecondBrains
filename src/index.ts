import express, { Request, Response } from "express";
import {z} from "zod";
import mongoose from "mongoose";
import {Content, User} from "./db"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { userMiddleWare } from "./middleware";
import {JWT_SECRET} from "./config"
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());  


const userSchema = z.object({
    username: z.string(),
    password: z.string().min(5),
});

//@ts-ignore
app.post("/api/v1/signup", async (req : Request, res:Response) => {
    console.log(req.body);
    // Zod validation
    const Userdata = userSchema.safeParse(req.body);
    if (!Userdata.success) {
        return res.status(400).json({ 
            success: false, 
            error: Userdata.error.errors 
        });
    }

    try {
        // Hash password with salt rounds
        const hashedPassword = await bcrypt.hash(Userdata.data.password, 10);

        // Create user in database
        await User.create({
            username: Userdata.data.username,
            password: hashedPassword,
        });

        res.json({
            success: true,
            message: "User signed up successfully",
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: (error as Error).message,
        });
    }
});


//@ts-ignore
app.post("/api/v1/signin",async (req,res)=>{
    
    try{
    const user  = userSchema.safeParse(req.body);
    if (!user.success) {
        return res.status(400).json({ 
            success: false, 
            error: user.error.errors 
        });
    }
    const existUser = await User.findOne({username:user.data.username});
    if(!existUser){
        return res.status(401).json({ 
            success: false, 
            message: "Invalid username or password" 
        });
    }
    //@ts-ignore
    const isPasswordValid =  bcrypt.compare(user.data.password, existUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid username or password" 
            });
        }
    
    
     // Generate JWT Token with expiry
     const token = jwt.sign({ id: existUser._id }, JWT_SECRET);

     return res.json({
         success: true,
         token: token,
         message: "User signed in successfully",
     });
    
     } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: (error as Error).message 
        });
    }
})

//@ts-ignore
app.post("/api/v1/content",userMiddleWare,(req,res)=>{
    const link = req.body.link;
    const contentType  = req.body.contentType;
    Content.create({
        link:link,
        type:contentType,
        //@ts-ignore
        userId:req.userId,
        tags:[]
    });
    return res.json({
        message:"content added"
    });


})

//@ts-ignore
app.get("/api/v1/content",userMiddleWare, async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    const content = await Content.find({
        userId:userId
    }).populate("userId","username");
    return res.json({
        content:content
    });


});


//@ts-ignore
app.delete("/api/v1/content",userMiddleWare,async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    const contentId = req.body.contentId;

    
    //@ts-ignore
   
    const content = await Content.deleteOne({
        _id : contentId,
        userId:userId,
        
    })
    return res.json({
        message : "content deleted successfully"
    });
});

//@ts-ignore
app.post("/api/v1/brain/share",userMiddleWare,async (req,res)=>{
    const  contentId = req.body.contentId;
    const contentExist= await Content.findOne({
        _id :contentId,
        //@ts-ignore
        userId :req.userId
    });
    if(!contentExist){
        return res.status(403).json({
            message:"content does not exist"
        })
    }
    else{
        return res.json({
            sharelink:`/api/v1/brain/${contentId}`
        })
    }
    
});

//@ts-ignore
app.get("/api/v1/brain/:sharelink",async (req,res)=>{
    const contentId = req.params.sharelink;
    const contentExist= await Content.findOne({
        _id :contentId,
    }).populate("userId","username");
    if(!contentExist){
        return res.status(403).json({
            message:"content does not exist"
        })
    }
    return res.json({
        content : contentExist
    })


})

app.listen(3000,()=>{
    console.log("sever started");
});