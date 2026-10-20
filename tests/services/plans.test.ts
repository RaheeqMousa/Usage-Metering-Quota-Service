import { beforeEach, describe, expect, it, vi } from "vitest";
import {insertPlan, getAllPlans, getPlanById, updateCustomPlan,} from "../../src/db/queries/plans.js";
import {createPlan,getPlans, getPlan,editCustomPlan,seedPlans,} from "../../src/services/plans.js";


vi.mock("../../src/db/queries/plans.js", ()=>({
    insertPlan: vi.fn(),
    getAllPlans: vi.fn(),
    getPlanById: vi.fn(),
    updateCustomPlan: vi.fn(),
}));

const mockPlan = {
    id: "plan-1",
    name: "Mock Custom Plan",
    createdAt: new Date(),
    updatedAt: new Date(),
    monthlyLimit: 1000,
    maxUnitsPerRequest: 100,
    type: "custom" as const,
    ownerAccountId: "account-1" as string | null,
};

beforeEach(()=>{
    vi.resetAllMocks()
});

describe("create plan", ()=>{

    const validPlan={
        name: "Custom Plan",
        monthlyLimit: 1000,
        maxUnitsPerRequest: 100,
        type: "custom" as const,
        ownerAccountId: "account-1",
    };

    it("accepts and create plan with valid input ",async()=>{
        vi.mocked(insertPlan).mockResolvedValue(mockPlan);

        const result= await createPlan(validPlan);
        expect(result).toEqual(mockPlan);
        expect(insertPlan).toHaveBeenCalledWith(
            "Custom Plan",
            1000,
            100,
            "custom",
            "account-1"
        );
    });

    it("trim the additionaly spaces from the plan name",async()=>{
        vi.mocked(insertPlan).mockResolvedValue(mockPlan);

        const result= await createPlan({...validPlan,name:" Custom Plan  "});
        expect(result).toEqual(mockPlan);
        expect(insertPlan).toHaveBeenCalledWith(
            "Custom Plan",
            1000,
            100,
            "custom",
            "account-1"
        );
    });

    it("rejects an empty plan name", async()=>{
        await expect(
            createPlan({
                name:"",
                monthlyLimit: 1000,
                maxUnitsPerRequest: 100,
                type: "custom",
                ownerAccountId: "account-1",
            })
        ).rejects.toThrow("Plan name cannot be empty");

        expect(insertPlan).not.toHaveBeenCalled();
    });

    it("rejects a non-positive monthly limit", async()=>{
        await expect(
            createPlan({ ...validPlan, monthlyLimit: 0 })
        ).rejects.toThrow("Monthly limit must be a positive integer");

        expect(insertPlan).not.toHaveBeenCalled();
    });

    it("rejects a non integer monthly limit", async()=>{
        await expect(
            createPlan({...validPlan, monthlyLimit:99.6})
        ).rejects.toThrow("Monthly limit must be a positive integer")
        expect(insertPlan).not.toHaveBeenCalled();
    })

    it("rejects a negative maximum units per request value", async()=>{
        await expect(
            createPlan({...validPlan, maxUnitsPerRequest:1.5})
        ).rejects.toThrow("Maximum units per request must be a positive integer")
        expect(insertPlan).not.toHaveBeenCalled();
    })

    it("rejects a non integer units per request value", async()=>{
        await expect(
            createPlan({...validPlan, maxUnitsPerRequest:-1})
        ).rejects.toThrow("Maximum units per request must be a positive integer")
        expect(insertPlan).not.toHaveBeenCalled();
    })

    it("reject max units per request to be greater than monthly limit", async()=>{
        await expect(
            createPlan({...validPlan, maxUnitsPerRequest:200, monthlyLimit:100})
        ).rejects.toThrow("Maximum units per request cannot exceed the monthly limit")
        expect(insertPlan).not.toHaveBeenCalled();
    })

    it("rejects a custom plan without an owner account", async () => {
        await expect(
            createPlan({
            ...validPlan,
            ownerAccountId: null,
            })
        ).rejects.toThrow("Account ID is required for custom plans");

        expect(insertPlan).not.toHaveBeenCalled();
    });

    it("rejects creation plan without being a custom type", async () => {
        await expect(
            createPlan({
            ...validPlan,
            type: "predefined",})
        ).rejects.toThrow("Only custom plans can be created through this operation");

        expect(insertPlan).not.toHaveBeenCalled();
    });
});


describe("get plans",()=>{

    it("throw when no account id passed", async()=>{
        await expect(
            getPlans("")
        ).rejects.toThrow("login in first to view plans");

        expect(getAllPlans).not.toHaveBeenCalled();
    });


    it("get all plans", async()=>{
        const plans = [mockPlan];

        vi.mocked(getAllPlans).mockResolvedValue(plans as never);

        const result = await getPlans("account-1");

        expect(result).toEqual(plans);
        expect(getAllPlans).toHaveBeenCalledOnce();
        expect(getAllPlans).toHaveBeenCalledWith("account-1");
    });

});


describe("get plan", () => {
    it("returns a plan by ID", async () => {
        vi.mocked(getPlanById).mockResolvedValue(mockPlan);

        const result = await getPlan("plan-1");

        expect(result).toEqual(mockPlan);
        expect(getPlanById).toHaveBeenCalledWith("plan-1");
    });

    it("rejects an empty plan id", async () => {
        await expect(
            getPlan(" ")
        ).rejects.toThrow("Plan ID cannot be empty");

        expect(getPlanById).not.toHaveBeenCalled();
    });

    it("rejects when the plan does not exist", async () => {
        vi.mocked(getPlanById).mockResolvedValue(undefined as never);

        await expect(
            getPlan("plan-3")
        ).rejects.toThrow("Plan not found");

        expect(getPlanById).toHaveBeenCalledWith("plan-3");
    });
});


describe("editCustomPlan", () => {
    it("updates a custom plan with valid input", async () => {
        vi.mocked(getPlanById).mockResolvedValue(mockPlan);
        vi.mocked(updateCustomPlan).mockResolvedValue(mockPlan);

        const result = await editCustomPlan(
            "plan-1",
            "Updated Plan",
            2000,
            200,
            "account-1",
        );

        expect(result).toEqual(mockPlan);
        expect(updateCustomPlan).toHaveBeenCalledWith(
            "plan-1",
            "Updated Plan",
            2000,
            200,
            "account-1"
        );
    });

    it("rejects an empty plan ID", async () => {
        await expect(
            editCustomPlan(" ", "Updated Plan", 2000, 200,"account-1",)
        ).rejects.toThrow("Plan ID cannot be empty");

        expect(updateCustomPlan).not.toHaveBeenCalled();
    });

    it("rejects an empty plan name", async () => {
        await expect(
            editCustomPlan("plan-1", " ", 2000, 200, "account-1",)
        ).rejects.toThrow("Plan name cannot be empty");
    });

    it("rejects an invalid monthly limit", async () => {
        await expect(
            editCustomPlan("plan-1", "Updated Plan", 0, 200, "account-1",)
        ).rejects.toThrow("Monthly limit must be a positive integer");
    });

    it("rejects a maximum per request greater than the monthly limit", async () => {
        await expect(
            editCustomPlan("plan-1", "Updated Plan", 100, 200, "account-1",)
        ).rejects.toThrow("Maximum units per request cannot exceed the monthly limit");
    });

    it("rejects editing a predefined plan", async () => {
        vi.mocked(getPlanById).mockResolvedValue({
            ...mockPlan,
            type: "predefined",
            ownerAccountId: null,
        } as never);

        await expect(editCustomPlan("plan-1","Updated Plan", 2000,200,"account-1"))
        .rejects
        .toThrow("Predefined plans cannot be edited");

        expect(updateCustomPlan).not.toHaveBeenCalled();
        });

    it("rejects editing another account's custom plan", async () => {
        vi.mocked(getPlanById).mockResolvedValue({
            ...mockPlan,
            ownerAccountId: "account-2",
        } as never);

        await expect(
            editCustomPlan(
            "plan-1",
            "Updated Plan",
            2000,
            200,
            "account-1"
            )
        ).rejects.toThrow(
            "You cannot edit another account's custom plan"
        );

        expect(updateCustomPlan).not.toHaveBeenCalled();
        });

    it("rejects editing when the plan does not exist", async () => {
        vi.mocked(getPlanById).mockResolvedValue(undefined as never);

        await expect(
            editCustomPlan(
            "missing-plan",
            "Updated Plan",
            2000,
            200,
            "account-1"
            )
        ).rejects.toThrow("Plan not found");

        expect(updateCustomPlan).not.toHaveBeenCalled();
    });
});
