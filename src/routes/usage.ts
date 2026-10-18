import { consumeUsage } from "../services/usage.js";
import {Router} from "express";
import { authenticateAccount, AuthRequest } from '../middleware/authentication.js';

const router = Router();

router.post('/consume', authenticateAccount, async (req: AuthRequest,res)=>{
    try{  
        const { userId, requestId, units } = req.body ?? {};

        if (typeof userId!== "string" || typeof requestId !== "string" ||!Number.isSafeInteger(units) ||units <= 0){
            return res.status(400).json({
                error: "consuming units requires userId, requestId, and positive integer units",});
        }

        const result= await consumeUsage(req.accountId!, userId, requestId, units);
        if(result.duplicate){ // check whether this requestId was already processed and recorded in the database.
            return res.status(200).json(result);
        }

        if(result.status==="rejected"){ // check whether the usage was recorded as rejected
            return res.status(429).json(result);
        }

        return res.status(200).json(result);
    }catch(error){
        const message=error instanceof Error? error.message: "Failed to consume units";

        if(message==="Account not found"){
            return res.status(404).json({ error: message });
        } if(message==="User not found"){
            return res.status(404).json({ error: message });
        } if(message==="Plan not found"){
            return res.status(404).json({ error: message });
        }

        return res.status(500).json({
            error: message,
        });
    }
});

export default router;