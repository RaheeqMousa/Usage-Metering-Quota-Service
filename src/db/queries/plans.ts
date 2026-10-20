import {db} from "../index.js";
import {newPlan, plan} from "../schema.js";
import {eq, and, or} from "drizzle-orm";

export type PlanType = "predefined" | "custom";

export async function getAllPlans(accountId: string) {
  return db
    .select()
    .from(plan)
    .where(
      or(
        eq(plan.type, "predefined"),
        and(
          eq(plan.type, "custom"),
          eq(plan.ownerAccountId, accountId)
        )
      )
    );
}

export async function getPlanById(planId: string) {
  const [result]=await db.select().from(plan).where(eq(plan.id, planId)).limit(1);
  return result;
}

export async function insertPlan(name: string, monthlyLimit: number, maxUnitsPerRequest: number, type:PlanType, ownerAccountId:string|null) {
  const [p]= await db.insert(plan).values({
    name: name.trim(),
    monthlyLimit: monthlyLimit,
    maxUnitsPerRequest: maxUnitsPerRequest,
    type,
    ownerAccountId:ownerAccountId,
  }).returning();

  return p;
}

export async function updateCustomPlan(planId: string, name: string, monthlyLimit: number, maxUnitsPerRequest: number, accountId:string) {

  const [result] = await db
    .update(plan)
    .set({
      name,
      monthlyLimit,
      maxUnitsPerRequest,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(plan.id, planId),
        eq(plan.type, "custom"),
        eq(plan.ownerAccountId, accountId),
      ),
    )
    .returning();

  if (!result) {
    throw new Error("Custom plan not found or access denied");
  }

  return result;
}

export async function getPredefinedPlanByName(name: string) {
  const [result] = await db
    .select()
    .from(plan)
    .where(
      and(
        eq(plan.name, name),
        eq(plan.type, "predefined")
      )
    )
    .limit(1);

  return result;
}