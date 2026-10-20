import { beforeEach, describe, expect, it, vi } from "vitest";
import {insertUser, getUserById,getUsers, editUserPlan,userUsage, userUsageHistory,} from "../../src/db/queries/users.js";
import { getPlanById } from "../../src/db/queries/plans.js";
import {createUser, getUser, getAllUsers,updateUserPlan, getUserUsage, getUserUsageHistory,} from "../../src/services/users.js";

vi.mock("../../src/db/queries/users.js", () => ({
    insertUser: vi.fn(),
    getUserById: vi.fn(),
    getUsers: vi.fn(),
    editUserPlan: vi.fn(),
    userUsage: vi.fn(),
    userUsageHistory: vi.fn(),
}));

vi.mock("../../src/db/queries/plans.js", () => ({
    getPlanById: vi.fn(),
}));

beforeEach(() => {
    vi.resetAllMocks();
});

const mockPlan = {
    id: "plan-1",
    name: "Starter",
    monthlyLimit: 1000,
    maxUnitsPerRequest: 100,
    type: "predefined" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerAccountId: "account-1",
};

const mockUser = {
    id: "user-1",
    name: "Alice",
    accountId: "account-1",
    planId: "plan-1",
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockUsage = {
    userId: "user-1",
    month: "2026-01",
    consumed: 250,
    allowance: 1000,
    remaining: 750,
    maxUnitsPerRequest: 100,
};

const mockHistory = [
    {
        id: "usage-1",
        userId: "user-1",
        requestId: "request-1",
        accountId: "account-1",
        units: 25,
        status: "approved" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];


describe("createUser", () => {
    it("rejects an empty user name", async () => {
        await expect(
        createUser({
            name: "   ",
            accountId: "account-1",
            planId: "plan-1",
        })
        ).rejects.toThrow("User name is required");
    });

    it("rejects a non string user name", async () => {
        await expect(
        createUser({
            name: "   ",
            accountId: "account-1",
            planId: "plan-1",
        })
        ).rejects.toThrow("User name is required");
    });

    it("rejects an empty account ID", async () => {
        await expect(
        createUser({
            name: "Alice",
            accountId: " ",
            planId: "plan-1",
        })
        ).rejects.toThrow("Account ID is required");
    });

    it("rejects an empty plan ID", async () => {
        await expect(
        createUser({
            name: "Alice",
            accountId: "account-1",
            planId: " ",
        })
        ).rejects.toThrow("Plan ID is required");
    });

    it("rejects when the selected plan does not exist", async () => {
        vi.mocked(getPlanById).mockResolvedValue(undefined as never);

        await expect(
            createUser({
                name: "Alice",
                accountId: "account-1",
                planId: "missing-plan",
            })
        )
        .rejects
        .toThrow("Selected plan not found");

        expect(insertUser).not.toHaveBeenCalled();
    });

    it("creates a user with trimmed input", async () => {
        vi.mocked(getPlanById).mockResolvedValue(mockPlan);
        vi.mocked(insertUser).mockResolvedValue(mockUser);

        const result = await createUser({
            name: " Alice ",
            accountId: " account-1 ",
            planId: " plan-1 ",
        });

        expect(getPlanById).toHaveBeenCalledWith("plan-1");
        expect(insertUser).toHaveBeenCalledWith(
            "Alice",
            "account-1",
            "plan-1");

        expect(result).toEqual(mockUser);
    });
});

describe("change user plan",()=>{
    it("rejects an empty account id", async()=>{
        await expect(updateUserPlan("user-id", "plan-1"," "))
        .rejects
        .toThrow("Account ID cannot be empty");  
    });

    it("rejects an empty user id", async()=>{
        await expect(updateUserPlan(" ", "plan-1","account-id"))
        .rejects
        .toThrow("User ID cannot be empty");  
    });

    it("rejects an empty plan id", async()=>{
        await expect(updateUserPlan("user-id", " ","account-id"))
        .rejects
        .toThrow("Plan ID cannot be empty");  
    });

    it("rejects when the selected plan does not exist", async()=>{
        vi.mocked(getPlanById).mockResolvedValue(undefined as never);

        await expect(updateUserPlan("user-id", "plan-1","account-id"))
        .rejects
        .toThrow("Selected plan not found"); 

        expect(editUserPlan).not.toHaveBeenCalled();
    });

    it("updates the user's plan", async () => {
        vi.mocked(getPlanById).mockResolvedValue(mockPlan);
        vi.mocked(editUserPlan).mockResolvedValue({
        ...mockUser,
        planId: "plan-1",
        });

        const result = await updateUserPlan(
        " user-1 ",
        " plan-1 ",
        " account-1 "
        );

        expect(editUserPlan).toHaveBeenCalledWith(
        "user-1",
        "plan-1",
        "account-1"
        );
        expect(result).toEqual({ ...mockUser, planId: "plan-1" });
    });

});

describe("get user",()=>{
    it("throws when user ID is empty", async () => {
        await expect(getUser(" ", "account-1"))
        .rejects
        .toThrow("User ID cannot be empty");
    });

    it("throws when account ID is empty", async () => {
        await expect(getUser("user-1", " "))
        .rejects
        .toThrow("Account ID cannot be empty");
    });

    it("returns the user for the given IDs", async () => {
        vi.mocked(getUserById).mockResolvedValue(mockUser);

        const result = await getUser(" user-1 ", " account-1 ");

        expect(getUserById).toHaveBeenCalledWith("user-1", "account-1");
        expect(result).toEqual(mockUser);
    });
});

describe("get all users",()=>{
    it("returns all users for an account", async () => {
        vi.mocked(getUsers).mockResolvedValue([mockUser]);

        const result = await getAllUsers("account-1");

        expect(getUsers).toHaveBeenCalledWith("account-1");
        expect(result).toEqual([mockUser]);
    });

    it("returns an empty array when no users exist", async () => {
        vi.mocked(getUsers).mockResolvedValue([]);

        const result = await getAllUsers("account-1");

        expect(result).toEqual([]);
    });
});

describe("get user usage", ()=>{
    it("throws when user ID is empty", async () => {
        await expect(getUserUsage(" ", "account-1"))
        .rejects
        .toThrow("User ID cannot be empty");
    });

    it("throws when account ID is empty", async () => {
        await expect(getUserUsage("user-1", " "))
        .rejects
        .toThrow("account ID cannot be empty");
    });

    it("returns usage details for the user", async () => {
        vi.mocked(userUsage).mockResolvedValue(mockUsage);

        const result = await getUserUsage("user-1", "account-1");

        expect(userUsage).toHaveBeenCalledWith("user-1", "account-1");
        expect(result).toEqual(mockUsage);
    });
});

describe("get user usage history", ()=>{
    it("throws when user ID is empty", async () => {
        await expect(getUserUsageHistory(" ", "account-1"))
        .rejects
        .toThrow("User ID cannot be empty");
    });

    it("throws when account ID is empty", async () => {
        await expect(getUserUsageHistory("user-1", " "))
        .rejects
        .toThrow("Account ID cannot be empty");
    });

    it("throws when limit is zero", async () => {
        await expect(getUserUsageHistory("user-1", "account-1", 0))
        .rejects
        .toThrow("Limit must be a positive integer");
    });

    it("throws when limit is not an integer", async () => {
        await expect(getUserUsageHistory("user-1", "account-1", 1.5))
        .rejects
        .toThrow("Limit must be a positive integer");
    });

    it("throws when offset is negative", async () => {
        await expect(getUserUsageHistory("user-1", "account-1", 5, -1))
        .rejects
        .toThrow("Offset must be a non-negative integer");
    });

    it("throws when offset is not an integer", async () => {
        await expect(getUserUsageHistory("user-1", "account-1", 5, 1.5))
        .rejects
        .toThrow("Offset must be a non-negative integer");
    });

    it("returns usage history with the supplied pagination", async () => {
        vi.mocked(userUsageHistory).mockResolvedValue(mockHistory);

        const result = await getUserUsageHistory(
            "user-1",
            "account-1",
            10,
            5
        );

        expect(userUsageHistory).toHaveBeenCalledWith(
            "user-1",
            "account-1",
            10,
            5
        );
        expect(result).toEqual(mockHistory);
    });

    it("uses the default limit and offset", async () => {
        vi.mocked(userUsageHistory).mockResolvedValue(mockHistory);

        await getUserUsageHistory("user-1", "account-1");

        expect(userUsageHistory).toHaveBeenCalledWith(
            "user-1",
            "account-1",
            5,
            0
        );
    });
});