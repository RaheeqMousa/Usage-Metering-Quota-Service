import {Router} from 'express';
import {createAccount,getMyAccount, editAccountPlan, getAccountUsageHistory, getAccountUsagePlan, sumApprovedUsage, getAccountUsage} from'../services/accounts.js';
import {authenticateAccount, AuthRequest} from '../middleware/authentication.js'

const router= Router();

//create a new account
router.post('/', async (req, res) => {
    try{
        const { name, planId } = req.body;

        const account = await createAccount({name, planId});
        res.status(201).json(account);
    }catch(err){
        res.status(500).json({error: (err as Error).message})
    }
});

router.get('/my', authenticateAccount, async (req: AuthRequest, res) => {
    try {
        const account = await getMyAccount(req.accountId!);
        return res.status(200).json(account);
    } catch (err) {
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to get account",
        });
    }
});

//returns the authenticated account
router.put("/my/plan", authenticateAccount, async (req: AuthRequest, res) => {
    try {
        const { planId } = req.body;
        const plan = await editAccountPlan(req.accountId!,planId);
        return res.status(200).json(plan);
    } catch (err) {
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update plan",
        });
    }
});

//returns the authenticated account plan
router.get("/my/plan", authenticateAccount, async (req: AuthRequest, res) => {
    try {
        const plan = await getAccountUsagePlan(req.accountId!);
        return res.status(200).json(plan);
    } catch (err) {
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update plan",
        });
    }
});

//this returns the usage history of an account
router.get("/my/history", authenticateAccount, async (req: AuthRequest, res)=>{
    try{
        const limit = Number(req.query.limit ?? 10);
        const offset = Number(req.query.offset ?? 0);

        const history = await getAccountUsageHistory(
            req.accountId!,
            limit,
            offset
        );
        return res.status(200).json(history);
    }catch(err){
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to retrieve account history",
        });
    }
});

//this returnes the sum of consumed units
router.get("/my/aprroved", authenticateAccount, async (req:AuthRequest, res)=>{
    try{
        const { start, end } = req.query;

        if (typeof start !== "string" || typeof end !== "string") {
            return res.status(400).json({
                error: "start and end query parameters are required"
            });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                error: "Invalid date format. Use YYYY-MM-DD."
            });
        }

        const sum= await sumApprovedUsage(req.accountId!, startDate, endDate);
        return res.status(200).json(sum);
    }catch(err){
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to retrieve sum of approved plans",
        });
    }
});


router.get("/my/usage", authenticateAccount, async (req:AuthRequest, res)=>{
    try{
        return res.status(200).json(await getAccountUsage(req.accountId!));
    }catch(err){
        return res.status(500).json({
            error: err instanceof Error? err.message: "Failed to retrieve account's usage"
        });
    }
});

export default router;