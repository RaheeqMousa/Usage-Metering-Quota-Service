import express from "express";
import {env} from "./config/env.js";
import accountsRouter from './routes/accounts.js';
import usersRouter from './routes/users.js';
import plansRouter from './routes/plans.js';
import usageRouter from './routes/usage.js'

const app=express();

app.get("/health",(_req, res)=>{
    res.status(200).json("Welcome to the Usage Metering and Quota Service");
});

app.use(express.json());
app.use('/accounts', accountsRouter);
app.use('/users', usersRouter);
app.use('/plans', plansRouter);
app.use('/usage',usageRouter)

const port= env.port;
app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});