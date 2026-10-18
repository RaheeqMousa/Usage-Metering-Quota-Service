import {insertUser, getUserById, getUsers, editUserPlan, userUsage, userUsageHistory} from '../db/queries/users.js';
import { newUser } from '../db/schema.js';
import { getPlanById } from '../db/queries/plans.js';

type CreateUserInput = {
  name: string;
  accountId: string;
  planId: string;
};

export async function createUser(input: CreateUserInput): Promise<newUser> {
    const { name, accountId, planId } = input;

    if (typeof name !== "string" || !name.trim()) {
        throw new Error("User name is required");
    }

    if (typeof accountId !== "string" || !accountId.trim()) {
        throw new Error("Account ID is required");
    }

    if (typeof planId !== "string" || !planId.trim()) {
        throw new Error("Plan ID is required");
    }

    const trimmedPlanId=planId.trim();

    const plan = await getPlanById(trimmedPlanId);

    if (!plan) {
        throw new Error("Selected plan not found");
    }

    return await insertUser(
        name.trim(),
        accountId.trim(),
        trimmedPlanId
    );
}


export async function getUser(userId:string, accountId:string){
    if(userId.trim().length==0){
        throw new Error("User ID cannot be empty");
    }
    if(accountId.trim().length==0){
        throw new Error("Account ID cannot be empty");
    }
    return await getUserById(userId.trim(), accountId.trim());
}

export async function getAllUsers(accountId:string){
    return await getUsers(accountId);
}

export async function updateUserPlan(userId: string, planId: string, accountId:string){
    if(userId.trim().length==0){
        throw new Error("User ID cannot be empty");
    }
    if(planId.trim().length==0){
        throw new Error("Plan ID cannot be empty");
    }
    if (!accountId?.trim()) {
        throw new Error("Account ID cannot be empty");
    }

    const plan = await getPlanById(planId.trim());

    if (!plan) {
        throw new Error("Selected plan not found");
    }

    return await editUserPlan(
        userId.trim(),
        planId.trim(),
        accountId.trim()
    );
}

export async function getUserUsage(userId:string, accountId: string){
    if(userId.trim().length==0){
        throw new Error("User ID cannot be empty");
    }
    if(accountId.trim().length==0){
        throw new Error("account ID cannot be empty");
    }
    
    return await userUsage(userId, accountId);
}

export async function getUserUsageHistory(userId:string, accountId: string, limit:number=5, offset:number=0){
    if(userId.trim().length==0){
        throw new Error("User ID cannot be empty");
    }
    if(accountId.trim().length==0){
        throw new Error("Account ID cannot be empty");
    }
    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("Limit must be a positive integer");
    }

    if (!Number.isInteger(offset) || offset < 0) {
        throw new Error("Offset must be a non-negative integer");
    }
    
    return await userUsageHistory(userId, accountId,limit, offset);
}
