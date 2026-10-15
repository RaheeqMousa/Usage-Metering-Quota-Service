import express from "express";
import {env} from "./config/env.js";

const app=express();
app.use(express.json());

app.get("/health",(_req, res)=>{
    res.status(200).send("Welcome to the Usage Metering and Quota Service");
});

const port= env.port;
app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});