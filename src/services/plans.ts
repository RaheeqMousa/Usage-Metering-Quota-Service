import {insertPlan, getAllPlans, getPlanById, updateCustomPlan, PlanType} from "../db/queries/plans.js";
import {account, newPlan} from '../db/schema.js'

export type CreatePlanInput = {
  name: string;
  monthlyLimit: number;
  maxUnitsPerRequest: number;
  type: PlanType;
  ownerAccountId: string|null;
};

export async function createPlan(input: CreatePlanInput): Promise<newPlan>{
    const {name, monthlyLimit, maxUnitsPerRequest, type, ownerAccountId}= input;

    if(type!=="custom"){
        throw new Error("Only custom plans can be created through this operation");
    }
    if (!ownerAccountId) {
        throw new Error("Account ID is required for custom plans");
    }
    if(name.trim().length==0){
        throw new Error("Plan name cannot be empty");
    }
    if (!Number.isInteger(monthlyLimit) || monthlyLimit <= 0) {
        throw new Error("Monthly limit must be a positive integer");
    }

    if (!Number.isInteger(maxUnitsPerRequest) || maxUnitsPerRequest <= 0) {
        throw new Error("Maximum units per request must be a positive integer");
    }

    if (maxUnitsPerRequest > monthlyLimit) {
        throw new Error("Maximum units per request cannot exceed the monthly limit");
    }

    return await insertPlan(name.trim(), monthlyLimit, maxUnitsPerRequest, type, ownerAccountId);
}

export async function getPlans(accountId: string) {
  if(!accountId || typeof accountId!=="string"){
    throw new Error("login in first to view plans")
  }
  return await getAllPlans(accountId);
}

export async function getPlan(planId: string){
  if(planId.trim().length==0){
    throw new Error("Plan ID cannot be empty");
  }
  const result= await getPlanById(planId);
  if(!result){
    throw new Error("Plan not found");
  }
  return result;
}

export async function editCustomPlan(planId: string, name: string, monthlyLimit: number, maxUnitsPerRequest: number, accountId: string) {
  if(planId.trim().length==0){
    throw new Error("Plan ID cannot be empty");
  }
  if(name.trim().length==0){
    throw new Error("Plan name cannot be empty");
  }
  if (!Number.isInteger(monthlyLimit) || monthlyLimit <= 0) {
    throw new Error("Monthly limit must be a positive integer");
  }
  if (!Number.isInteger(maxUnitsPerRequest) || maxUnitsPerRequest <= 0) {
    throw new Error("Maximum units per request must be a positive integer");
  }
  if (maxUnitsPerRequest > monthlyLimit) {
    throw new Error("Maximum units per request cannot exceed the monthly limit");
  }
  if (!accountId) {
    throw new Error("Account ID is required for custom plans");
  }


  const existingPlan = await getPlanById(planId);

  if (!existingPlan) {
    throw new Error("Plan not found");
  }
  if (existingPlan.type !== "custom") {
    throw new Error("Predefined plans cannot be edited");
  }
  if (existingPlan.ownerAccountId !== accountId) {
    throw new Error("You cannot edit another account's custom plan");
  }

  return await updateCustomPlan(planId, name, monthlyLimit, maxUnitsPerRequest, accountId);
}



export async function seedPlans() {
  const predefinedPlans = [
    { name: "Starter", monthlyLimit: 1000, maxUnitsPerRequest: 100 },
    { name: "Pro", monthlyLimit: 10000, maxUnitsPerRequest: 1000 },
    { name: "Basic", monthlyLimit: 200, maxUnitsPerRequest: 20 },
    { name: "Premium", monthlyLimit: 2000, maxUnitsPerRequest: 200 },
  ];

  for (const plan of predefinedPlans) {
    await insertPlan(
      plan.name,
      plan.monthlyLimit,
      plan.maxUnitsPerRequest,
      "predefined",
      null
    );
  }
}
