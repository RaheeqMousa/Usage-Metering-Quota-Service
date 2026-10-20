import { beforeEach, describe, expect, it, vi } from "vitest";
import {getAccountDetails, insertAccount, updateAccountPlan,findAccountUsagePlan,
sumApprovedAccountUsage, findAccountUsageHistory,accountUsage, findAccountByApiKeyHash} from "../../src/db/queries/accounts.js";
import { getPlanById } from "../../src/db/queries/plans.js";
import {createAccount, getMyAccount, editAccountPlan, getAccountUsagePlan, getAccountUsageHistory,
  sumApprovedUsage, getAccountUsage, authenticateApiKey} from "../../src/services/accounts.js";


vi.mock("../../src/db/queries/accounts.js", () => ({
    getAccountDetails: vi.fn(),
    insertAccount: vi.fn(),
    updateAccountPlan: vi.fn(),
    findAccountUsagePlan: vi.fn(),
    sumApprovedAccountUsage: vi.fn(),
    findAccountUsageHistory: vi.fn(),
    accountUsage: vi.fn(),
    findAccountByApiKeyHash: vi.fn(),
})); //replcaes the db function with a mock functions to avoid using teh real db

vi.mock("../../src/db/queries/plans.js", () => ({
    getPlanById: vi.fn(),
}));

beforeEach(()=>{
    vi.resetAllMocks()
});// reset mocks before each test so that one test would nott accidentally affect another.


// these objects are the records our mocked database will return in the tests.
const mockPlan = {
    id: "plan-1",
    name: "Starter",
    monthlyLimit: 1000,
    maxUnitsPerRequest: 100,
    type: "predefined" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerAccountId: null,
};

const mockAccount = {
    id: "account-1",
    name: "raheeq",
    planId: "plan-1",
    apiKeyHash: "mock-api-key-hash",
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockAccountDetails = {
    id: "account-1",
    name: "raheeq",
    createdAt: new Date(),
    planId: "plan-1",
    planName: "Starter",
    monthlyLimit: 1000,
    maxUnitsPerRequest: 100,
    planType: "predefined" as const,
};

describe("createAccount", () => {
    it("rejects to create an account with an empty name", async () => {
        await expect(createAccount({ name: " " }))
            .rejects
            .toThrow("Account name cannot be empty");

        expect(insertAccount).not.toHaveBeenCalled();
    });
});



describe("editAccountPlan", () => {
    it("rejects an empty account ID", async () => {
        await expect(editAccountPlan(" ", "plan-1"))
        .rejects
        .toThrow("Account ID cannot be empty");

        expect(getPlanById).not.toHaveBeenCalled();
        expect(updateAccountPlan).not.toHaveBeenCalled();
    });

    it("rejects an empty plan ID", async () => {
        await expect(editAccountPlan("account-1", " "))
        .rejects
        .toThrow("Plan ID cannot be empty");

        expect(getPlanById).not.toHaveBeenCalled();
        expect(updateAccountPlan).not.toHaveBeenCalled();
    });

    it("rejects when the selected plan does not exist", async () => {
        vi.mocked(getPlanById).mockResolvedValue(undefined as never);

        await expect(editAccountPlan("account-1", "plan-2"))
        .rejects
        .toThrow("Selected plan not found");

        expect(getPlanById).toHaveBeenCalledWith("plan-2");
        expect(updateAccountPlan).not.toHaveBeenCalled();
    });

    it("updates the account plan successfully", async () => {
        const updatedAccount = {
            ...mockAccount,
            planId: "plan-2",
        };

        vi.mocked(getPlanById).mockResolvedValue({
            ...mockPlan,
            id: "plan-2",
        });
        vi.mocked(updateAccountPlan).mockResolvedValue(updatedAccount);

        const result = await editAccountPlan("account-1", "plan-2");

        expect(result).toEqual(updatedAccount);
        expect(getPlanById).toHaveBeenCalledWith("plan-2");
        expect(updateAccountPlan).toHaveBeenCalledWith("account-1","plan-2");
    });

    it("returns usage history", async () => {
        const mockHistory = [
            { id: "usage-1" },
            { id: "usage-2" },
        ] as never;

        vi.mocked(findAccountUsageHistory).mockResolvedValue(mockHistory);

        const result = await getAccountUsageHistory(
            "account-1",
            10,
            20
        );

        expect(result).toBe(mockHistory);
        expect(findAccountUsageHistory).toHaveBeenCalledWith(
            "account-1",
            10,
            20
        );
    });
});


describe("getAccountUsageHistory", () => {
    it("rejects an empty account ID", async () => {
        await expect(getAccountUsageHistory(" "))
        .rejects
        .toThrow("Account ID cannot be empty");

        expect(findAccountUsageHistory).not.toHaveBeenCalled();
    });

    it("rejects a limit less than one", async () => {
        await expect(getAccountUsageHistory("account-1", 0))
        .rejects
        .toThrow("Limit must be positive integer");

        expect(findAccountUsageHistory).not.toHaveBeenCalled();
    });

    it("rejects a non-integer limit", async () => {
        await expect(getAccountUsageHistory("account-1", 1.5))
        .rejects
        .toThrow("Limit must be positive integer");

        expect(findAccountUsageHistory).not.toHaveBeenCalled();
    });

    it("rejects a negative offset", async () => {
        await expect(getAccountUsageHistory("account-1", 5, -1))
        .rejects
        .toThrow("Limit must be non-negative integer");

        expect(findAccountUsageHistory).not.toHaveBeenCalled();
    });

    it("rejects a non-integer offset", async () => {
        await expect(getAccountUsageHistory("account-1", 5, 1.5))
        .rejects
        .toThrow("Limit must be non-negative integer");

        expect(findAccountUsageHistory).not.toHaveBeenCalled();
    });

    it("returns the total sum of approved usage units", async () => {
        const start = new Date("2026-01-01");
        const end = new Date("2026-01-31");

        vi.mocked(sumApprovedAccountUsage).mockResolvedValue({consumedUnits:250});

        const result = await sumApprovedUsage("account-1", start,end);

        expect(result).toEqual({consumedUnits:250});
        expect(sumApprovedAccountUsage).toHaveBeenCalledWith("account-1", start, end);
        expect(sumApprovedAccountUsage).toHaveBeenCalledTimes(1);
    });
});


describe("authenticateApiKey", () => {
    it("rejects an empty API key", async () => {
        await expect(authenticateApiKey(" "))
        .rejects
        .toThrow("API key is required");

        expect(findAccountByApiKeyHash).not.toHaveBeenCalled();
    });

    it("rejects invalid API key", async ()=>{
        vi.mocked(findAccountByApiKeyHash).mockResolvedValue(undefined as never);
        const hashedApiKey = "a".repeat(64);

        await expect(authenticateApiKey(hashedApiKey))
        .rejects
        .toThrow("Invalid API key");

        expect(findAccountByApiKeyHash).toHaveBeenCalledTimes(1);
    });

    it("rejects an API key belonging to a different account", async () => {
        vi.mocked(findAccountByApiKeyHash).mockResolvedValue({id: "account-1",} as never);

        await expect(authenticateApiKey("my-secret-api-key", "account-2"))
        .rejects
        .toThrow("API key does not belong to this account");
    });

    it("accepts a matching expected account ID", async () => {
        vi.mocked(findAccountByApiKeyHash).mockResolvedValue({id: "account-1",} as never);

        const result = await authenticateApiKey(
            "my-secret-api-key",
            "account-1"
        );

        expect(result).toBe("account-1");
    });
});


describe("getMyAccount", () => {
    it("rejected an empty account id", async () => {
        await expect(getMyAccount(""))
        .rejects
        .toThrow("Account ID cannot be empty");
    });

    it("returns account details for a valid account ID", async () => {
        vi.mocked(getAccountDetails).mockResolvedValue(mockAccountDetails);

        const result = await getMyAccount("account-1");

        expect(result).toEqual(mockAccountDetails);
        expect(getAccountDetails).toHaveBeenCalledWith("account-1");
    });
});

describe("sumApprovedUsage", () => {
    it("reject an empty account ID", async () => {
        await expect(
        sumApprovedUsage("", new Date("2026-01-01"), new Date("2026-01-31"))
        )
        .rejects
        .toThrow("Account ID cannot be empty");
    });

    it("throws an error when start date is invalid", async () => {
        await expect(
        sumApprovedUsage(
            "account-1",
            new Date("invalid"),
            new Date("2026-01-31")
        )
        )
        .rejects
        .toThrow("Start and end must be valid dates");
    });

    it("throws an error when end date is invalid", async () => {
        await expect(
        sumApprovedUsage(
            "account-1",
            new Date("2026-01-01"),
            new Date("invalid"))
        )
        .rejects
        .toThrow("Start and end must be valid dates");
    });

    it("throws an error when start date is after end date", async () => {
        await expect(
        sumApprovedUsage("account-1", new Date("2026-02-01"),new Date("2026-01-01")))
        .rejects
        .toThrow("Start date must be before or equal to end date");
    });

    it("returns approved usage for valid dates", async () => {
        const start = new Date("2026-01-01");
        const end = new Date("2026-01-31");

        vi.mocked(sumApprovedAccountUsage).mockResolvedValue({
        consumedUnits: 250,
        });

        const result = await sumApprovedUsage("account-1", start, end);

        expect(result).toEqual({ consumedUnits: 250 });
        expect(sumApprovedAccountUsage).toHaveBeenCalledWith(
            "account-1",
            start,
            end
        );
    });

    it("allows start date and end date to be equal", async () => {
        const date = new Date("2026-01-01");

        vi.mocked(sumApprovedAccountUsage).mockResolvedValue({consumedUnits: 0,});

        const result = await sumApprovedUsage("account-1", date, date);

        expect(result).toEqual({ consumedUnits: 0 });
    });
});

describe("getAccountUsage", () => {
    it("returns account usage", async () => {
        const mockUsage = { consumedUnits: 350 };

        vi.mocked(accountUsage).mockResolvedValue(mockUsage as never);

        const result = await getAccountUsage("account-1");

        expect(result).toEqual(mockUsage);
        expect(accountUsage).toHaveBeenCalledWith("account-1");
    });
});

describe("getAccountUsagePlan", () => {
    it("rejects an empty account ID", async () => {
        await expect(getAccountUsagePlan("")).rejects.toThrow(
        "Account ID cannot be empty"
        );
    });

    it("rejects when the plan ID does not exist", async () => {
        vi.mocked(findAccountUsagePlan).mockResolvedValue(undefined as never);

        await expect(getAccountUsagePlan("account-1"))
        .rejects
        .toThrow("Could not retrieve plan assigned to that account id");
    });

    it("returns the assigned plan", async () => {
        vi.mocked(findAccountUsagePlan).mockResolvedValue(mockPlan);

        const result = await getAccountUsagePlan("account-1");

        expect(result).toEqual(mockPlan);
        expect(findAccountUsagePlan).toHaveBeenCalledWith("account-1");
    });
});
