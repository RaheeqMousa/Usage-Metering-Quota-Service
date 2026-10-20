import {getAccountDetails, insertAccount, updateAccountPlan, findAccountUsagePlan, 
    sumApprovedAccountUsage, findAccountUsageHistory, accountUsage
} from "../db/queries/accounts.js";
import { getPlanById } from "../db/queries/plans.js";
import {createHash,randomBytes } from "node:crypto"
import { findAccountByApiKeyHash } from "../db/queries/accounts.js";

type CreateAccountInput = {
  name: string;
  planId: string;
};
export type CreatedAccount = {
  id: string;
  name: string;
  planId: string;
  createdAt: Date;
};
export type CreateAccountOutput={
    account: CreatedAccount;
    apiKey:string;
}

export async function createAccount(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const { name, planId } = input;

    if(input.name?.trim().length==0){
        throw new Error("Account name cannot be empty");
    }
    if(input.planId?.trim().length==0){
        throw new Error("Plan ID cannot be empty");
    }

    const plan= await getPlanById(planId);
    if(!plan){
        throw new Error("Selected plan not found");
    }

    if (plan.type === "custom") {
        throw new Error("You cannot use another account's custom plan");
    }

    const apiKey= randomBytes(32).toString("hex");
    const hashedApiKey = createHash("sha256")
        .update(apiKey)
        .digest("hex");

    const createdAccount = await insertAccount(
        name,
        hashedApiKey,
        planId,
    );

    // return the raw API key only once.
    return {
        account: createdAccount,
        apiKey,
    };
}

// get account details
export async function getMyAccount(accountId: string) {
    if(!accountId?.trim()){
        throw new Error("Account ID cannot be empty")
    }

    return await getAccountDetails(accountId);
}

export async function editAccountPlan(accountId: string, planId: string,) {
    if (!accountId?.trim()) {
        throw new Error("Account ID cannot be empty");
    }
    if (!planId?.trim()) {
        throw new Error("Plan ID cannot be empty");
    }

    const plan= await getPlanById(planId);
    if(!plan){
        throw new Error("Selected plan not found");
    }

    if (plan.type === "custom" && plan.ownerAccountId !== accountId) {
        throw new Error("You cannot use another account's custom plan");
    }

    return await updateAccountPlan(accountId,planId);
}

export async function getAccountUsagePlan(accountId: string){
    if(!accountId?.trim()){
        throw new Error("Account ID cannot be empty");
    }

    const plan= await findAccountUsagePlan(accountId);
    if(!plan){
        throw new Error("Could not retrieve plan assigned to that account id");
    }

    return plan;
}

export async function getAccountUsageHistory(accountId: string, limit:number=5, offset:number=0){
    if(!accountId?.trim()){
        throw new Error("Account ID cannot be empty");
    }
    if(limit<1|| !Number.isInteger(limit)){
        throw new Error("Limit must be positive integer");
    }
    if(offset<0|| !Number.isInteger(offset)){
        throw new Error("Limit must be non-negative integer");
    }
    const history= await findAccountUsageHistory(accountId,limit,offset);
    if(!history){
        throw new Error("Could not retrieve usage history assigned to that account id");
    }

    return history;
}

export async function sumApprovedUsage(accountId: string, start:Date, end:Date){
    if (!accountId?.trim()) {
        throw new Error("Account ID cannot be empty");
    }

    if (!(start instanceof Date)|| !(end instanceof Date) || Number.isNaN(start.getTime()) ||Number.isNaN(end.getTime()) ){
        throw new Error("Start and end must be valid dates");
    }

    if (start > end){
        throw new Error(
            "Start date must be before or equal to end date"
        );
    }

    return sumApprovedAccountUsage(accountId, start, end);
}

export async function getAccountUsage(accountId:string){
    return await accountUsage(accountId);
}

export async function authenticateApiKey(apiKey: string, expectedAccountId?: string): Promise<string> {
  if (!apiKey?.trim()) {
    throw new Error("API key is required");
  }

  const hashedApiKey = createHash("sha256")
    .update(apiKey)
    .digest("hex");

  const matchedAccount = await findAccountByApiKeyHash(hashedApiKey);

  if (!matchedAccount) {
    throw new Error("Invalid API key");
  }

  if (expectedAccountId &&matchedAccount.id !== expectedAccountId){
    throw new Error("API key does not belong to this account");
  }

  return matchedAccount.id;
}