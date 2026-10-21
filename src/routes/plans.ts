import { authenticateAccount, AuthRequest } from "../middleware/authentication.js";
import {getPlan, getPlans, createPlan, editCustomPlan} from "../services/plans.js";
import {Router} from "express";

export const router= Router();

//get all plans
router.get('/', authenticateAccount,async (req:AuthRequest,res)=>{
    try{
        const plans= await getPlans(req.accountId!);
        res.status(200).json(plans);
    }catch(err){
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to retrieve all plans",
        })
    }
});

// get plan by id
router.get('/:planId', authenticateAccount ,async (req:AuthRequest,res)=>{
    try{
        const planId= req.params.planId;
        const accountId= req.accountId;
        if (!accountId || typeof accountId !== "string") {
            return res.status(401).json({
            error: "login first to view a plan",
            });
        }
        if (typeof planId!== "string" || planId.trim().length === 0){
            return res.status(400).json({
                error: "Plan ID is required",});
        }
        const plan= await getPlan(planId, req.accountId!);

        if(!plan){
            return res.status(404).json("Plan not found");
        }
        return res.status(200).json(plan);
    }catch(err){
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to get a plan by id",
        })
    }
});

// create a new plan
router.post('/', authenticateAccount,async (req:AuthRequest,res)=>{
    try{
        const {name, monthlyLimit, maxUnitsPerRequest, type}= req.body;
        const plan= await createPlan({name, monthlyLimit, maxUnitsPerRequest,type, ownerAccountId:req.accountId!});
        res.status(201).json(plan);
    }catch(err){
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create a new plan",
        })
    }    
});

// update a custom plan
router.put('/:planId',authenticateAccount,async (req:AuthRequest,res)=>{
    try{
        const planId= req.params.planId;

        const {name, monthlyLimit, maxUnitsPerRequest}= req.body;
         if(typeof(planId)!=="string"){
            return res.status(400).json({error:"Invalid plan ID"});
        }
        const plan= await editCustomPlan(planId, name, monthlyLimit, maxUnitsPerRequest, req.accountId!);
        res.status(200).json(plan);
    }catch(err){
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update that custom plan",
        })
    }
});

export default router;