import {db} from '../index.js'
import {user, plan, usageRequest} from '../schema.js'
import {eq,sql,sum,and, gte, lt,desc} from 'drizzle-orm';
import {getMonthBoundaries} from '../../utilities/utilities.js'

export async function insertUser(name: string, accountId: string, planId: string) {
    const [newUser] = await db
    .insert(user)
    .values({
        name,
        accountId,
        planId,})
    .returning();
    
    return newUser;
}

export async function getUserById(userId: string, accountId: string) {
    const [userRecord] = await db
        .select()
        .from(user)
        .where(and(eq(user.id, userId), eq(user.accountId, accountId)))
        .limit(1);

    return userRecord;
}

export async function getUsers(accountId:string){
    return await db.select().from(user).where(eq(user.accountId, accountId));
}

export async function editUserPlan(userId: string, planId: string, accountId: string) {
    const[updatedUser]= await db
        .update(user)
        .set({planId:planId, updatedAt: new Date()})
        .where(and(
            eq(user.id,userId),
            eq(user.accountId, accountId)
        ))
        .returning();
    return updatedUser;
}

export async function userUsage(userId: string, accountId: string){
    const {monthStart, nextMonthStart}= getMonthBoundaries();
    
    const [result]= await db
    .select({
        userId: user.id,
        monthlyLimit: plan.monthlyLimit,
        maxUnitsPerRequest: plan.maxUnitsPerRequest,
        consumed: sql`coalesce(${sum(usageRequest.units)},0)`
    })
    .from(user)
    .innerJoin(plan,eq(plan.id, user.planId))
    .leftJoin(usageRequest,
        and(
            eq(usageRequest.userId, userId),
            eq(usageRequest.accountId, accountId),
            eq(usageRequest.status, "approved"),
            gte(usageRequest.createdAt, monthStart),
            lt(usageRequest.createdAt, nextMonthStart)
        )
    ).where(
        and(
            eq(user.id, userId),
            eq(user.accountId, accountId)
        )
    ).groupBy(
        user.id,
        plan.monthlyLimit,
        plan.maxUnitsPerRequest
    )
    .limit(1);

    const consumed = Number(result.consumed);
    const allowance = Number(result.monthlyLimit);

    return {
        userId,
        month: monthStart.toISOString().slice(0, 7),
        consumed,
        allowance,
        remaining: Math.max(0, allowance - consumed),
        maxUnitsPerRequest: Number(result.maxUnitsPerRequest),
    };
}

export async function userUsageHistory(userId: string, accountId: string, limit:number, offset:number){
    const result= await db
    .select()
    .from(usageRequest)
    .where(and(
        eq(usageRequest.userId, userId),
        eq(usageRequest.accountId, accountId)
    ))
    .orderBy(desc(usageRequest.createdAt), desc(usageRequest.id))
    .limit(limit)
    .offset(offset);

    return result;
}

type Transaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
export async function sumApprovedUserUsage(tx: Transaction,userId: string, accountId: string, start:Date, end:Date){      
    const [result]= await tx
        .select({
            consumedUnits: sql<number>`
            coalesce(sum(${usageRequest.units}), 0)::int`
        }).from(usageRequest)
        .where(
            and(
                eq(usageRequest.userId, userId),
                eq(usageRequest.accountId, accountId),
                eq(usageRequest.status, "approved"),
                gte(usageRequest.createdAt, start),
                lt(usageRequest.createdAt, end)
            )
        );
    
    return Number(result.consumedUnits);
}