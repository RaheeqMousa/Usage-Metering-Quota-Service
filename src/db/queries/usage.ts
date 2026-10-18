import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../index.js";
import { account, user, plan, usageRequest } from "../schema.js";
import {getMonthBoundaries} from '../../utilities/utilities.js';
import {sumApprovedAccountUsageTrans} from './accounts.js';
import {sumApprovedUserUsage, getUserById} from './users.js';

export async function consumeUsageDb(accountId: string, userId: string, requestId: string, units:number){
    return db.transaction(async (trans)=>{

        const [acc]= await trans
        .select()
        .from(account)
        .where(eq(account.id,accountId))
        .for("update");

        if(!acc)
            throw new Error("Account not found");

        const [existing]= await trans
        .select()
        .from(usageRequest)
        .where(
            and(
                eq(usageRequest.requestId, requestId),
                eq(usageRequest.accountId, accountId),
            )
        ).limit(1);

        if(existing){
            return {
            duplicate: true,
            status: existing.status,
            request: existing}
        }

        const foundUser = await getUserById(userId, accountId);

        if (!foundUser) throw new Error("User not found");

        const [accountPlan] = await trans
            .select()
            .from(plan)
            .where(eq(plan.id, acc.planId))
            .limit(1);

        const [userPlan] = await trans
            .select()
            .from(plan)
            .where(eq(plan.id, foundUser.planId))
            .limit(1);

        if (!accountPlan || !userPlan) {
            throw new Error("Plan not found");
        }

        const {monthStart, nextMonthStart}=getMonthBoundaries();

        const accountConsume= Number(await sumApprovedAccountUsageTrans(trans,accountId, monthStart, nextMonthStart));
        const userConsume= Number(await sumApprovedUserUsage(trans,userId, accountId, monthStart, nextMonthStart));

        console.log("consumed units by user: "+userConsume);
        console.log("requested units: "+units);
        console.log("limit user plan: "+userPlan.monthlyLimit);

        let reason: string|null=null;

        if(units>accountPlan.maxUnitsPerRequest || units> userPlan.maxUnitsPerRequest){
            reason="Requested units exceeds the maximum units"
        }else if(accountConsume+units > accountPlan.monthlyLimit){
            reason="Account monthly limit exceed";
        }else if(userConsume+ units > userPlan.monthlyLimit){
            reason = "User monthly limit exceeded";
        }

        const status= reason? "rejected":"approved";
        
        const [insertedUsageReqeust]= await trans
            .insert(usageRequest)
            .values({
                accountId,
                userId,
                requestId,
                units,
                status,
            })
            .returning();
        
        return {
            duplicate: false,
            status,
            reason,
            request: insertedUsageReqeust,
        };
    });
} 

