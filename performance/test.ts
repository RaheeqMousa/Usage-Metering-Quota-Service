import { consumeUsage } from "../src/services/usage.js";
import {getAccountUsage} from '../src/services/accounts.js';
import {appendFile} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ACCOUNT_ID = "e73b5f3e-da94-4657-8804-37d495f052f0";
const USER_ID = "671f46d1-0351-47c4-8afe-472456a455dc";

async function printAccountUsage() {
    const usage = await getAccountUsage(ACCOUNT_ID);
    console.log("\nAccount usage:");
    console.log(usage);
}

async function test(total:number){
    let totalTime = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    for(let i=0;i<total;i++){

        let start= Date.now();

        try{
            const result= await consumeUsage(ACCOUNT_ID,USER_ID, randomUUID(), 1);
            if (result.status === "approved") {
                successfulRequests++;
            } else {
                failedRequests++;
                console.log(`Request rejected: ${result.status}`);
                console.log(result);
            }

            const duration= Date.now() - start;
            totalTime+=duration;
        }catch(err){
            failedRequests++;
            const duration= Date.now() - start;
            totalTime+=duration;
            console.error("Request error:", err);
        }
    }

    await printResults("sequential requests test",total,
        successfulRequests,failedRequests,totalTime);
}

async function concurrentTest(total: number) {
    let successfulRequests = 0;
    let failedRequests = 0;

    const startTime = Date.now();

    const results = await Promise.all(
        Array.from({ length: total }, async (_, i) => {
            try {

                const result = await Promise.race([
                    consumeUsage(ACCOUNT_ID, USER_ID, randomUUID(), 1),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error("Request timed out")), 10000)
                    )
                ]);

                return result.status === "approved";
            } catch (err) {
                console.error("Request error:", err);
                return false;
            }
        })
    );

    for (const success of results) {
        if (success) {
            successfulRequests++;
        } else {
            failedRequests++;
        }
    }

    await printResults("Concurrent Test", total, successfulRequests,failedRequests, Date.now() - startTime);

}

async function printResults(name: string,total: number,successful: number,
    failed: number,totalTime: number) {
    const result =
        `\n..........${name}...........\n` +
        `Total requests: ${total}\n` +
        `Successful requests: ${successful}\n` +
        `Failed requests: ${failed}\n` +
        `Total time: ${totalTime} ms\n` +
        `Average time: ${
            total > 0 ? (totalTime / total).toFixed(2) : "0.00"
        } ms\n`;

    console.log(result);

    const filePath = path.resolve("./performance/results.txt");

    try {
        await appendFile(filePath, result, "utf8");
        console.log(`Results saved to: ${filePath}`);
    } catch (error) {
        console.error("Failed to save results:", error);
    }
}

async function main() {
    await printAccountUsage();

    await test(10);
    await test(100);
    
    await printAccountUsage();
    console.log("Starting concurrent test...");

    await concurrentTest(100);

    console.log("Concurrent test finished.");

    await printAccountUsage();
}

main().catch(console.error);
