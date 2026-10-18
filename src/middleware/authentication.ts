import type {Request, Response, NextFunction} from 'express';
import {account} from '../db/schema.js';
import { getAccountByApiKey } from '../db/queries/accounts.js';
import {createHash} from 'node:crypto';

export interface AuthRequest extends Request{
    accountId?:string
}

export async function authenticateAccount(req: AuthRequest, res: Response, next: NextFunction){
    try{
        const apiKey= req.header("X-API-Key");

        if(!apiKey){
            return res.status(401).json({
                error:"API KEY IS MISSING"
            });
        }

        const hashedApiKey= createHash("sha256")
        .update(apiKey)
        .digest("hex");

        const foundAccount= await getAccountByApiKey(hashedApiKey);
        if(!foundAccount){
            res.status(401).json({error: "invalid API Key"});
        }

        req.accountId= foundAccount.id;
        next();
    }catch(err){
        console.error("Authentication error:", err);
        return res.status(500).json({
            error:"Authentication failed"
        });
    }
}