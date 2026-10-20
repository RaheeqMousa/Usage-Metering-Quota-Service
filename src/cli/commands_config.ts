
import fs from "node:fs/promises";
import os from "os";
import path from "path";
import { getPlans, getPlan, createPlan, editCustomPlan, CreatePlanInput } from "../services/plans.js";
import {createAccount, getMyAccount, editAccountPlan, getAccountUsagePlan, getAccountUsageHistory,
  sumApprovedUsage, getAccountUsage, authenticateApiKey} from "../services/accounts.js";
import {createUser,getUser,getAllUsers,
  updateUserPlan,getUserUsage,getUserUsageHistory,} from "../services/users.js";
import { consumeUsage } from "../services/usage.js";
import { randomUUID } from "node:crypto";

export type Config = {
	dbUrl: string;
	currentUserName: string;
};

export type CommandHandler= (cmdName:string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler){
	registry[cmdName]=handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]){
    const handler=registry[cmdName];
    if(!handler){
		  throw new Error(`Invalid Command: ${cmdName}`);
	  }
	
    await handler(cmdName, ...args);
}


// plan handlers

export async function getPlansHandler(_cmdName: string): Promise<void> {
  const { accountId } = await getLoggedInCredentials();
  const plan = await getPlans(accountId);
  console.log(plan);
}

export async function getPlanHandler(_cmdName: string, ...args: string[]): Promise<void> {
  const planId = args[0];

  if (!planId) {
    throw new Error("failed to retrieve plans");
  }

  const plan = await getPlan(planId);
  console.log(plan);
}

export async function createPlanHandler(_cmdName: string, ...args: string[]): Promise<void> {
  const [name, monthlyLimit, maxUnitsPerRequest] = args;

  if (!name || !monthlyLimit || !maxUnitsPerRequest) {
    throw new Error(
      `command: create-plan <name> <monthlyLimit> <maxUnitsPerRequest>`
    );
  }

  const { accountId } = await getLoggedInCredentials();

  const input: CreatePlanInput = {name,
    monthlyLimit: Number(monthlyLimit),
    maxUnitsPerRequest: Number(maxUnitsPerRequest),
    type: "custom",
    ownerAccountId:accountId
  };

  const plan = await createPlan(input);

  console.log("A Plan was created\n");
  console.log(JSON.stringify(plan, null, 2));
}

export async function editCustomPlanHandler(_cmdName: string, ...args: string[]): Promise<void> {
  const [planId, name, monthlyLimit, maxUnitsPerRequest] = args;

  if (!planId || !name || !monthlyLimit || !maxUnitsPerRequest) {
    throw new Error("command: edit-custom-plan <planId> <name> <monthlyLimit> <maxUnitsPerRequest>");
  }

  const { accountId } = await getLoggedInCredentials();

  const plan = await editCustomPlan(
    planId,
    name,
    Number(monthlyLimit),
    Number(maxUnitsPerRequest),
    accountId
  );

  console.log(plan);
}

// account handlers

type Credentials = {
  apiKey: string;
};

type LoggedInCredentials = Credentials & {
  accountId: string;
};

const configPath = path.join(os.homedir(), ".usage-metering.json");

async function saveCredintials(apiKey: string): Promise<void> {
  await fs.mkdir(path.dirname(configPath), {
    recursive: true,
    mode: 0o700,
  });

  await fs.writeFile(
    configPath,
    JSON.stringify({ apiKey }),
    { mode: 0o600 }
  );

  await fs.chmod(configPath, 0o600);
}

async function getLoggedInCredentials(): Promise<LoggedInCredentials> {
  let content: string;

  try {
    content = await fs.readFile(configPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("You are not logged in. Please log in first.");
    }

    throw error;
  }

  let credentials: Credentials;

  try {
    credentials = JSON.parse(content) as Credentials;
  } catch {
    throw new Error("Invalid credentials file. Please log in again.");
  }

  if (!credentials.apiKey?.trim()) {
    throw new Error("Invalid credentials. Please log in again.");
  }

  // Validate the API key and retrieve the account ID every time.
  const accountId = await authenticateApiKey(credentials.apiKey);

  if (!accountId) {
    throw new Error("Invalid API key. Please log in again.");
  }

  return {
    apiKey: credentials.apiKey,
    accountId,
  };
}

export async function loginHandler(_cmdName: string, ...args: string[]): Promise<void> {
  const apiKey = args[0]?.trim();

  if (!apiKey) {
    throw new Error("command: login <apiKey>");
  }

  const accountId = await authenticateApiKey(apiKey);

  if (!accountId) {
    throw new Error("Invalid API key.");
  }

  await saveCredintials(apiKey);

  console.log("Logged in successfully");
  console.log(`Account ID: ${accountId}`);
}

export async function logoutHandler(_cmdName: string): Promise<void> {
  try {
    await fs.unlink(configPath);
    console.log("Logged out successfully");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("You are not logged in");
      return;
    }

    throw error;
  }
}

export async function createAccountHandler(_cmdName: string,...args: string[]): Promise<void> {
  const [name, planId] = args;

  if (!name || !planId) {
    throw new Error("command: create-account <name> <planId>");
  }

  const result = await createAccount({ name, planId });

  // automatic log in using the new account's API key.
  await saveCredintials(result.apiKey);

  console.log("Account created successfully");
  console.log("Account:", result.account);
  console.log("Logged in automatically");
}


export async function getAccountHandler(_cmdName: string, ..._args: string[]): Promise<void> {
  const { accountId } = await getLoggedInCredentials();

  const result = await getMyAccount(accountId);

  console.log("Account details:\n");
  console.log(result);
}

export async function updateAccountPlanHandler(_cmdName: string,...args: string[]): Promise<void> {
  const planId = args[0];

  if (!planId) {
    throw new Error("command: update-account-plan <planId>");
  }

  const { accountId } = await getLoggedInCredentials();

  const result = await editAccountPlan(accountId, planId);

  console.log("Account plan updated successfully\n");
  console.log(result);
}

export async function getAccountUsagePlanHandler(_cmdName: string, ..._args: string[]): Promise<void> {
  const { accountId } = await getLoggedInCredentials();

  const result = await getAccountUsagePlan(accountId);

  console.log("Account usage plan:\n");
  console.log(result);
}

export async function getAccountUsageHistoryHandler(_cmdName: string, ...args: string[]): Promise<void> {
  const [limitArg, offsetArg] = args;

  const limit = limitArg === undefined ? 5 : Number(limitArg);
  const offset = offsetArg === undefined ? 0 : Number(offsetArg);

  if (!Number.isInteger(limit) || !Number.isInteger(offset)) {
    throw new Error("Limit and offset must be integers");
  }

  const { accountId } = await getLoggedInCredentials();

  const result = await getAccountUsageHistory(accountId, limit, offset);

  console.log("Account usage history:\n");
  console.log(result);
}

export async function sumApprovedUsageHandler(_cmdName: string,...args: string[]): Promise<void> {
  const [startArg, endArg] = args;

  if (!startArg || !endArg) {
    throw new Error(
      "Usage: account-sum-approved-usage <startDate> <endDate>"
    );
  }

  const start = new Date(startArg);
  const end = new Date(endArg);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("Please provide valid dates");
  }

  const { accountId } = await getLoggedInCredentials();

  const result = await sumApprovedUsage(accountId, start, end);

  console.log("Total approved usage:\n");
  console.log(result);
}

export async function getAccountUsageHandler(_cmdName: string,..._args: string[]): Promise<void> {
  const { accountId } = await getLoggedInCredentials();

  const result = await getAccountUsage(accountId);

  console.log("Account usage:\n");
  console.log(result);
}


// user cli commands handlers


// Get all users belonging to the logged-in account
export async function getAllUsersHandler(_cmdName: string,..._args: string[]): Promise<void> {
  const { accountId } = await getLoggedInCredentials();

  const users = await getAllUsers(accountId);

  console.log("Users:\n");
  console.log(users);
}

// Get a specific user
export async function getUserHandler(_cmdName: string,...args: string[]): Promise<void> {
  const userId = args[0];

  if (!userId) {
    throw new Error("command: get-user <userId>");
  }

  const { accountId } = await getLoggedInCredentials();

  const user = await getUser(userId, accountId);

  if (!user) {
    throw new Error("User not found");
  }

  console.log("User details:\n");
  console.log(user);
}

// Create a user under the logged-in account
export async function createUserHandler(_cmdName: string,...args: string[]): Promise<void> {
  const [name, planId] = args;

  if (!name?.trim() || !planId?.trim()) {
    throw new Error("command: create-user <name> <planId>");
  }

  const { accountId } = await getLoggedInCredentials();

  const user = await createUser({
    name: name.trim(),
    accountId,
    planId,
  });

  console.log("User created successfully:\n");
  console.log(user);
}

// Update a user's plan
export async function updateUserPlanHandler(_cmdName: string,...args: string[]): Promise<void> {
  const [userId, planId] = args;

  if (!userId|| !planId) {
    throw new Error("command: change-user-plan <userId> <planId>");
  }

  const { accountId } = await getLoggedInCredentials();

  const updatedUser = await updateUserPlan(userId, planId,accountId);

  if (!updatedUser) {
    throw new Error("User not found");
  }

  console.log("User plan updated successfully:\n");
  console.log(updatedUser);
}

// Get a user's current usage
export async function getUserUsageHandler(_cmdName: string,...args: string[]): Promise<void> {
  const userId = args[0];

  if (!userId) {
    throw new Error("command: user-usage <userId>");
  }

  const { accountId } = await getLoggedInCredentials();

  const result = await getUserUsage(userId, accountId);

  if (!result) {
    throw new Error("User not found");
  }

  console.log("User usage:\n");
  console.log(result);
}

// Get a user's usage history
export async function getUserUsageHistoryHandler(_cmdName: string,...args: string[]): Promise<void> {
  const userId = args[0];

  if (!userId) {
    throw new Error("command: user-usage-history <userId>");
  }

  const { accountId } = await getLoggedInCredentials();

  const result = await getUserUsageHistory(userId, accountId);

  if (!result) {
    throw new Error("User not found");
  }

  console.log("User usage history:\n");
  console.log(result);
}

// consume handler

export async function consumeUsageHandler(_cmdName: string,...args: string[]): Promise<void> {
  const [userId, unitsArg] = args;

  if (!userId|| unitsArg===undefined) {
    throw new Error("command: consume-usage <userId> <units>");
  }

  const units = Number(unitsArg);

  if (!Number.isSafeInteger(units) || units <= 0) {
    throw new Error("Units must be a positive safe integer");
  }

  const { accountId } = await getLoggedInCredentials();

  // generate a unique request ID automatically.
  const requestId = randomUUID();

  const result = await consumeUsage(
    accountId,
    userId,
    requestId,
    units
  );

  if (result.duplicate) {
    console.log("This request was already processed:\n");
    console.log(result);
    return;
  }

  if (result.status === "rejected") {
    console.log("Usage rejected:\n");
    console.log(result);
    return;
  }

  console.log("Usage consumed successfully:\n");
  console.log("Request ID:", requestId);
  console.log(result);
}

export function help() {
  console.log(`
Usage Metering and Quota Service CLI

Usage:
  npm run cli -- <command>

PLAN COMMANDS
  plans                       List available plans
                              npm run cli -- plans
  plan                        Get details of a plan
                              npm run cli -- plan <plan-id>
  create-plan                 Create a custom plan
                              npm run cli -- create-plan <name> <monthlyLimit> <maxUnitsPerRequest>
  edit-custom-plan            Edit a custom plan
                              npm run cli -- edit-custom-plan <planId> <name> <monthlyLimit> <maxUnitsPerRequest>

ACCOUNT COMMANDS
  login                       Log in to an account
                              npm run cli -- login <apiKey>
  logout                      Log out of an account
                              npm run cli -- logout
  create-account              Create a new account
                              npm run cli -- create-account <accountName> <planId>
  my-account                  View account details
                              npm run cli -- my-account
  change-account-plan         Change the account plan
                              npm run cli -- change-account-plan <planId>
  account-usage-plan          View the account's usage plan
                              npm run cli -- account-usage-plan
  account-usage-history       View account usage history
                              npm run cli -- account-usage-history
  account-sum-approved-usage  Sum approved account usage
                              npm run cli -- account-sum-approved-usage <startDate> <endDate>
  account-usage               View account usage
                              npm run cli -- account-usage

USER COMMANDS
  list-users                  List account users
                              npm run cli -- list-users
  get-user                    Get user details
                              npm run cli -- get-user <user-id>
  create-user                 Create a user
                              npm run cli -- create-user <userName> <planId>
  change-user-plan            Change a user's plan
                              npm run cli -- change-user-plan <userId> <planId>
  user-usage                  View user usage
                              npm run cli -- user-usage <userId>
  user-usage-history          View user usage history
                              npm run cli -- user-usage-history <userId>

USAGE COMMANDS
  consume-usage               Submit a usage request
                              npm run cli -- consume-usage <userId> <units>

HELP
  help                        Display available commands
                              npm run cli -- help
`);
}

export async function helpHandler(_cmdName: string): Promise<void> {
  help();
}