import {db} from '../index.js'
import {account, plan, usageRequest, user} from '../schema.js'
import {eq, desc, and ,gte, lte, lt, sql, sum} from 'drizzle-orm'
import {getMonthBoundaries} from '../../utilities/utilities.js'

export async function insertAccount(name:string, hashedApiKey: string, planId:string) {
    const [newAcc] = await db
        .insert(account)
        .values({
            name: name,
            apiKeyHash: hashedApiKey,
            planId: planId,
        })
        .returning();

        return newAcc;
}

export async function getAccountByApiKey(hashedApiKey:string){
    const [acc]= await db
    .select({ id: account.id })
    .from(account)
    .where(eq(account.apiKeyHash,hashedApiKey))
    .limit(1);

    return acc;
}

export async function getAccountById(id:string){
    const [acc]= await db
    .select()
    .from(account)
    .where(eq(account.id,id))
    .limit(1);

    return acc;
}

export async function getAccountDetails(id:string){
    const [result]= await db
    .select({
        id: account.id,
        name: account.name,
        createdAt: account.createdAt,
        planId: plan.id,
        planName: plan.name,
        monthlyLimit: plan.monthlyLimit,
        maxUnitsPerRequest: plan.maxUnitsPerRequest,
        planType: plan.type,
    })
    .from(account)
    .innerJoin(plan, eq(account.planId, plan.id))
    .where(eq(account.id,id))
    .limit(1);

    return result;
}

export async function updateAccountPlan(accountId:string, planId:string){
    const [updatedAccount]= await db
    .update(account)
    .set({
        planId: planId,
        updatedAt: new Date()
    })
    .where(eq(account.id,accountId))
    .returning({
        id: account.id,
        name: account.name,
        planId: account.planId,
    });

    if (!updatedAccount) {
        throw new Error("Account not found");
    }

    return updatedAccount;
}

export async function findAccountUsageHistory(accountId: string, limit: number, offset: number){
    return db
    .select()
    .from(usageRequest)
    .where(eq(usageRequest.accountId, accountId))
    .orderBy(desc(usageRequest.createdAt), desc(usageRequest.id))
    .limit(limit)
    .offset(offset);
}

export async function findAccountUsagePlan(accountId: string){
    const [result]= await db
    .select({
        monthlyLimit: plan.monthlyLimit,
        maxUnitsPerRequest: plan.maxUnitsPerRequest
    })
    .from(account)
    .innerJoin(plan, eq(account.planId, plan.id))
    .where(eq(account.id, accountId))
    .limit(1);

    return result
}

export async function sumApprovedAccountUsage(accountId: string, start:Date, end:Date){
    const [result]= await db
    .select({
        consumedUnits: sql<number>`
        coalesce(sum(${usageRequest.units}), 0)::int`
    })
    .from(usageRequest)
    .innerJoin(user, eq(usageRequest.userId, user.id))
    .where(
        and(
            eq(usageRequest.accountId, accountId),
            eq(user.accountId, accountId),
            eq(usageRequest.status, "approved"),
            gte(usageRequest.createdAt, start),
            lt(usageRequest.createdAt, end)
        )
    );

    return result;
}

type Transaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
export async function sumApprovedAccountUsageTrans(tx: Transaction,accountId: string, start:Date, end:Date){
    const [result]= await tx
    .select({
        consumedUnits: sql<number>`
        coalesce(sum(${usageRequest.units}), 0)::int`
    })
    .from(usageRequest)
    .innerJoin(user, eq(usageRequest.userId, user.id))
    .where(
        and(
            eq(usageRequest.accountId, accountId),
            eq(user.accountId, accountId),
            eq(usageRequest.status, "approved"),
            gte(usageRequest.createdAt, start),
            lt(usageRequest.createdAt, end)
        )
    );

    return Number(result.consumedUnits);
}

export async function accountUsage(id: string){
    const { monthStart, nextMonthStart } = getMonthBoundaries();

    const [result]= await db
    .select({
        accountId: account.id,
        monthlyLimit:plan.monthlyLimit,
        maxUnitsPerRequest: plan.maxUnitsPerRequest,
        consumed: sql<number> `
            coalesce(${sum(usageRequest.units)},0)`
    })
    .from(account)
    .innerJoin(plan,eq(plan.id, account.planId))
    .leftJoin(usageRequest,
        and(
            eq(usageRequest.accountId, account.id),
            eq(usageRequest.status, "approved"),
            gte(usageRequest.createdAt, monthStart),
            lt(usageRequest.createdAt, nextMonthStart),
        )
    )
    .where(eq(account.id,id))
    .groupBy(
        account.id,
        plan.monthlyLimit,
        plan.maxUnitsPerRequest,
    )
    .limit(1);

    const allowance= Number(result.monthlyLimit);
    const remaining= Number(result.monthlyLimit)- Number(result.consumed);
    const consumed= Number(result.consumed);

    return {
        id,
        month: monthStart.toISOString().slice(0, 7),
        consumed,
        allowance,
        remaining,
        maxUnitsPerRequest: Number(result.maxUnitsPerRequest),
    };
}

export async function findAccountByApiKeyHash(apiKeyHash: string){
  const [result] = await db
    .select({
      id: account.id,
    })
    .from(account)
    .where(eq(account.apiKeyHash, apiKeyHash))
    .limit(1);

  return result ?? null;
}