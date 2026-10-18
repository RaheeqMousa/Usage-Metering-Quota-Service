import {db} from "../index.js";
import {newPlan, plan} from "../schema.js";
import {eq, and} from "drizzle-orm";

export type PlanType = "predefined" | "custom";

export async function getAllPlans(){
  return await db.select().from(plan);
}

export async function getPlanById(planId: string) {
  const [result]=await db.select().from(plan).where(eq(plan.id, planId)).limit(1);
  return result;
}

export async function insertPlan(name: string, monthlyLimit: number, maxUnitsPerRequest: number, type:PlanType) {
  const [p]= await db.insert(plan).values({
    name: name.trim(),
    monthlyLimit: monthlyLimit,
    maxUnitsPerRequest: maxUnitsPerRequest,
    type
  }).returning();

  return p;
}

export async function updateCustomPlan(planId: string, name: string, monthlyLimit: number, maxUnitsPerRequest: number) {
  const [updatedPlan]= await db
  .update(plan)
  .set({
    name:name,
    monthlyLimit:monthlyLimit,
    maxUnitsPerRequest:maxUnitsPerRequest,
    updatedAt: new Date()
  })
  .where(and(
            eq(plan.id, planId),
            eq(plan.type, "custom"),
          ),)
  .returning();

  return updatedPlan;
}