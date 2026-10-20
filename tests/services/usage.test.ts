
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumeUsageDb } from "../../src/db/queries/usage.js";
import { consumeUsage } from "../../src/services/usage.js";

vi.mock("../../src/db/queries/usage.js", () => ({
    consumeUsageDb: vi.fn(),
}));

beforeEach(() => {
    vi.resetAllMocks();
});

const mockResult = {
    duplicate: false,
    status: "approved",
    reason: null,
    request: {
        id: "usage-1",
        requestId: "request-1",
        accountId: "account-1",
        userId: "user-1",
        units: 50,
        status: "approved",
    },
};

describe("consumeUsage", () => {
    it("calls consumeUsageDb with the correct arguments", async () => {
        vi.mocked(consumeUsageDb).mockResolvedValue(mockResult as never);

        await consumeUsage("account-1", "user-1", "request-1", 50);

        expect(consumeUsageDb).toHaveBeenCalledWith(
            "account-1",
            "user-1",
            "request-1",
            50
        );
    });

    it("returns the result from consumeUsageDb", async () => {
        vi.mocked(consumeUsageDb).mockResolvedValue(mockResult as never);

        const result = await consumeUsage(
            "account-1",
            "user-1",
            "request-1",
            50
        );

        expect(result).toEqual(mockResult);
    });

    it("propagates errors from consumeUsageDb", async () => {
        vi.mocked(consumeUsageDb).mockRejectedValue(
            new Error("Account not found")
        );

        await expect(
            consumeUsage("account-1", "user-1", "request-1", 50)
        ).rejects.toThrow("Account not found");
    });
});
