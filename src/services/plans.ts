import {insertPlan, getAllPlans, getPlanById, updateCustomPlan, PlanType} from "../db/queries/plans.js";
import {newPlan} from '../db/schema.js'

type CreatePlanInput = {
  name: string;
  monthlyLimit: number;
  maxUnitsPerRequest: number;
  type: PlanType;
};

export async function createPlan(input: CreatePlanInput): Promise<newPlan>{
    const {name, monthlyLimit, maxUnitsPerRequest, type}= input;

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

    return await insertPlan(name.trim(), monthlyLimit, maxUnitsPerRequest, type);
}

export async function getPlans() {
  return await getAllPlans();
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

export async function editCustomPlan(planId: string, name: string, monthlyLimit: number, maxUnitsPerRequest: number) {
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
  return await updateCustomPlan(planId, name, monthlyLimit, maxUnitsPerRequest);
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
    );
  }
}
