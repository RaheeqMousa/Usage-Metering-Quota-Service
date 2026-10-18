import { consumeUsageDb } from "../db/queries/usage.js";

export async function consumeUsage(
    accountId: string,
    userId: string,
    requestId: string,
    units: number,
) {
    return consumeUsageDb(
        accountId,
        userId,
        requestId,
        units,
    );
}
