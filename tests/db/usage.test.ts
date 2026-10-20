import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../src/db/index.js";
import {sumApprovedAccountUsageTrans,} from "../../src/db/queries/accounts.js";
import {sumApprovedUserUsage,getUserById} from "../../src/db/queries/users.js";
import { getMonthBoundaries } from "../../src/utilities/utilities.js";
import { consumeUsageDb } from "../../src/db/queries/usage.js";

vi.mock("../../src/db/index.js", () => ({
    db: {
        transaction: vi.fn(),
    },
}));

vi.mock("../../src/db/queries/accounts.js", () => ({
    sumApprovedAccountUsageTrans: vi.fn(),
}));

vi.mock("../../src/db/queries/users.js", () => ({
    sumApprovedUserUsage: vi.fn(),
    getUserById: vi.fn(),
}));

vi.mock("../../src/utilities/utilities.js", () => ({
    getMonthBoundaries: vi.fn(),
}));

beforeEach(() => {
    vi.resetAllMocks();
});

const mockAccount = {
    id: "account-1",
    name: "Alice",
    planId: "account-plan",
};

const mockUser = {
    id: "user-1",
    name: "Bob",
    accountId: "account-1",
    planId: "user-plan",
};

const mockAccountPlan = {
    id: "account-plan",
    name: "Account Plan",
    monthlyLimit: 1000,
    maxUnitsPerRequest: 100,
    type: "predefined" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockUserPlan = {
    id: "user-plan",
    name: "User Plan",
    monthlyLimit: 1000,
    maxUnitsPerRequest: 100,
    type: "predefined" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockInsertedRequest = {
    id: "usage-1",
    requestId: "request-1",
    accountId: "account-1",
    userId: "user-1",
    units: 50,
    status: "approved" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
};

// Creates a mock for a chainable Drizzle query.
function makeQuery(result: unknown) {
    const query: any = {};

    query.from = vi.fn(() => query);
    query.where = vi.fn(() => query);
    query.for = vi.fn().mockResolvedValue(result);
    query.limit = vi.fn().mockResolvedValue(result);

    return query;
}

function setupTransaction() {
    const accountQuery = makeQuery([mockAccount]);
    const duplicateQuery = makeQuery([]);
    const userQuery = makeQuery([mockUser]);
    const accountPlanQuery = makeQuery([mockAccountPlan]);
    const userPlanQuery = makeQuery([mockUserPlan]);

    const insertReturning = vi.fn().mockResolvedValue([
        mockInsertedRequest,
    ]);

    const insertValues = vi.fn(() => ({
        returning: insertReturning,
    }));

    const tx = {
        select: vi.fn()
            .mockReturnValueOnce(accountQuery)
            .mockReturnValueOnce(duplicateQuery)
            .mockReturnValueOnce(userQuery)
            .mockReturnValueOnce(accountPlanQuery)
            .mockReturnValueOnce(userPlanQuery),

        insert: vi.fn(() => ({
            values: insertValues,
        })),
    };

    vi.mocked(db.transaction).mockImplementation(
        (async (callback: (tx: any) => Promise<unknown>) =>
            callback(tx)) as never,
    );

    vi.mocked(getMonthBoundaries).mockReturnValue({
        monthStart: new Date("2026-01-01T00:00:00.000Z"),
        nextMonthStart: new Date("2026-02-01T00:00:00.000Z"),
    });

    vi.mocked(getUserById).mockResolvedValue(mockUser as never);
    vi.mocked(sumApprovedAccountUsageTrans).mockResolvedValue(0 as never);
    vi.mocked(sumApprovedUserUsage).mockResolvedValue(0 as never);

    return {
        accountQuery,
        duplicateQuery,
        userQuery,
        accountPlanQuery,
        userPlanQuery,
        tx,
        insertValues,
        insertReturning,
    };
}

describe("consumeUsageDb", () => {
    it("throws when the account does not exist", async () => {
        const { accountQuery } = setupTransaction();

        accountQuery.for.mockResolvedValue([]);

        await expect(
            consumeUsageDb("account-1", "user-1", "request-1", 50),
        ).rejects.toThrow("Account not found");
    });

    it("returns the existing request for a duplicate", async () => {
        const { duplicateQuery } = setupTransaction();

        const existing = {
            ...mockInsertedRequest,
            status: "approved" as const,
        };

        duplicateQuery.limit.mockResolvedValue([existing]);

        const result = await consumeUsageDb(
            "account-1",
            "user-1",
            "request-1",
            50,
        );

        expect(result).toEqual({
            duplicate: true,
            status: "approved",
            request: existing,
        });

        expect(getUserById).not.toHaveBeenCalled();
    });

    it("throws when the user does not exist", async () => {
        const { userQuery } = setupTransaction();

        userQuery.limit.mockResolvedValue([]);

        await expect(
            consumeUsageDb("account-1", "user-1", "request-1", 50),
        ).rejects.toThrow("User not found");
    });

    it("throws when the account plan does not exist", async () => {
        const { accountPlanQuery } = setupTransaction();

        accountPlanQuery.limit.mockResolvedValue([]);

        await expect(
            consumeUsageDb("account-1", "user-1", "request-1", 50),
        ).rejects.toThrow("Plan not found");
    });

    it("throws when the user plan does not exist", async () => {
        const { userPlanQuery } = setupTransaction();

        userPlanQuery.limit.mockResolvedValue([]);

        await expect(
            consumeUsageDb("account-1", "user-1", "request-1", 50),
        ).rejects.toThrow("Plan not found");
    });

    it("rejects a request that exceeds the maximum units", async () => {
        const { insertValues } = setupTransaction();

        const result = await consumeUsageDb(
            "account-1",
            "user-1",
            "request-1",
            101,
        );

        expect(result.status).toBe("rejected");
        expect(result.reason).toBe(
            "Requested units exceeds the maximum units",
        );

        expect(insertValues).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "rejected",
                units: 101,
            }),
        );
    });

    it("rejects a request that exceeds the account monthly limit", async () => {
        const { accountPlanQuery, insertValues } = setupTransaction();

        accountPlanQuery.limit.mockResolvedValue([
            { ...mockAccountPlan, monthlyLimit: 100 },
        ]);

        vi.mocked(sumApprovedAccountUsageTrans).mockResolvedValue(80 as never);

        const result = await consumeUsageDb(
            "account-1",
            "user-1",
            "request-1",
            30,
        );

        expect(result.status).toBe("rejected");
        expect(result.reason).toBe("Account monthly limit exceed");

        expect(insertValues).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "rejected",
                units: 30,
            }),
        );
    });

    it("rejects a request that exceeds the user monthly limit", async () => {
        const { userPlanQuery } = setupTransaction();

        userPlanQuery.limit.mockResolvedValue([
            { ...mockUserPlan, monthlyLimit: 100 },
        ]);

        vi.mocked(sumApprovedUserUsage).mockResolvedValue(80 as never);

        const result = await consumeUsageDb(
            "account-1",
            "user-1",
            "request-1",
            30,
        );

        expect(result.status).toBe("rejected");
        expect(result.reason).toBe("User monthly limit exceeded");
    });

    it("approves and inserts a request within all limits", async () => {
        const { insertValues } = setupTransaction();

        const result = await consumeUsageDb(
            "account-1",
            "user-1",
            "request-1",
            50,
        );

        expect(result.status).toBe("approved");
        expect(result.reason).toBeNull();
        expect(result.duplicate).toBe(false);

        expect(insertValues).toHaveBeenCalledWith({
            accountId: "account-1",
            userId: "user-1",
            requestId: "request-1",
            units: 50,
            status: "approved",
        });
    });
});