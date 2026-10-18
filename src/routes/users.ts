import {createUser, getUser, getAllUsers, updateUserPlan, getUserUsage, getUserUsageHistory} from '../services/users.js';
import {Router} from 'express';
import { authenticateAccount, AuthRequest } from '../middleware/authentication.js';

const router= Router();

//get all users
router.get('/',  authenticateAccount,async (req:AuthRequest,res)=>{
    try{
        const users= await getAllUsers(req.accountId!);
        return res.status(200).json(users);
    }catch(err){
        return res.status(500).json({
            error: err instanceof Error? err.message: "Failed to retrieve users"
        });
    }
});

//get user by id
router.get('/:userId', authenticateAccount,async (req:AuthRequest,res)=>{
    try{
        const userId= req.params.userId;
        if(typeof(userId)!=="string"){
            return res.status(400).json({error:"Invalid user ID"});
        }
        const user= await getUser(userId, req.accountId!);
        if(!user){
            return res.status(404).json("User not found");
        }
        return res.status(200).json(user);
    }catch(err){
        return res.status(500).json({
            error: err instanceof Error? err.message: "Failed to retrieve this user"
        });
    }
});

//create a new user
router.post('/', authenticateAccount, async (req:AuthRequest,res)=>{
    try{
        const { name, planId } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof planId !== "string"
        ) {
            return res.status(400).json({
                error: "Name and planId are required",
            });
        }

        const user = await createUser({
            name: name.trim(),
            accountId: req.accountId!,
            planId,
        });

        return res.status(201).json(user);
    }catch(err){
        return res.status(500).json({
            error: err instanceof Error? err.message: "Failed to create a new user"
        });
    }
});

//update a user's plan
router.put('/:userId/plan', authenticateAccount, async (req: AuthRequest, res) => {
    try {
        const userId = req.params.userId;
        const { planId } = req.body;

        if (
            typeof userId !== "string" ||
            typeof planId !== "string"
        ) {
            return res.status(400).json({
                error: "Valid userId and planId are required",
            });
        }

        const updatedUser = await updateUserPlan(
            userId,
            planId,
            req.accountId!
        );

        if (!updatedUser) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        return res.status(200).json(updatedUser);
    }catch(err){
        const message= err instanceof Error? err.message: "Failed to update user's plan"

        if(message==="Selected plan not found"){
            return res.status(404).json({
                error: message
            });
        }

        return res.status(500).json({
            error: message
        });
    }
});

//returns the usage 
router.get('/:userId/usage', authenticateAccount, async(req:AuthRequest,res)=>{
    try{
        const userId= req.params.userId;
        if(typeof(userId)!=="string"){
            return res.status(400).json({error:"Invalid user ID"});
        }
        const result= await getUserUsage(userId,req.accountId!);
        
        if(!result){
            return res.status(404).json({error:"user not found"});
        }

        return res.status(200).json({result});  
    }catch(err){
         res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to get user's usage",
        })
    }
});

//returns the history of the usage requests
router.get('/:userId/history', authenticateAccount, async(req:AuthRequest,res)=>{
    try{
        const userId= req.params.userId;
        if(typeof(userId)!=="string"){
            return res.status(400).json({error:"Invalid user ID"});
        }
        const result= await getUserUsageHistory(userId,req.accountId!);
        
        if(!result){
            return res.status(404).json({error:"user not found"});
        }

        return res.status(200).json({result});
    }catch(err){
         res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to get user's usage history",
        })
    }
});


export default router;