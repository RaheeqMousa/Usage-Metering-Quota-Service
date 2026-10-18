import { seedPlans } from "./plans.js";

async function main() {
  await seedPlans();
  console.log("Plans created successfully");
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create plans:", error);
  process.exitCode = 1;
});
