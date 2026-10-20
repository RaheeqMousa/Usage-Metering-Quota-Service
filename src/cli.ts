import {registerCommand, runCommand, CommandsRegistry, 
    getPlanHandler, getPlansHandler, createPlanHandler,editCustomPlanHandler,
    createAccountHandler, getAccountHandler, updateAccountPlanHandler,getAccountUsagePlanHandler,
    getAccountUsageHistoryHandler,sumApprovedUsageHandler,getAccountUsageHandler, loginHandler, logoutHandler, 
    getAllUsersHandler,getUserHandler,createUserHandler,
    updateUserPlanHandler, getUserUsageHandler,getUserUsageHistoryHandler, 
    consumeUsageHandler,} from "./cli/commands_config.js";

async function main(): Promise<void> {
    const register: CommandsRegistry = {};
    //plan commands
    registerCommand(register, "plans", getPlansHandler);
    registerCommand(register, "plan", getPlanHandler);
    registerCommand(register, "create-plan", createPlanHandler);
    registerCommand(register, "edit-custom-plan", editCustomPlanHandler);

    //account commands
    registerCommand(register, "login", loginHandler);
    registerCommand(register, "logout", logoutHandler);
    registerCommand(register, "create-account", createAccountHandler);
    registerCommand(register, "get-account", getAccountHandler);
    registerCommand(register, "change-account-plan", updateAccountPlanHandler);
    registerCommand(register, "account-usage-plan", getAccountUsagePlanHandler);
    registerCommand(register, "account-usage-history", getAccountUsageHistoryHandler);
    registerCommand(register, "account-sum-approved-usage", sumApprovedUsageHandler);
    registerCommand(register, "account-usage", getAccountUsageHandler);

    //user commands
    registerCommand(register, "list-users", getAllUsersHandler);
    registerCommand(register, "get-user", getUserHandler);
    registerCommand(register, "create-user", createUserHandler);
    registerCommand(register, "change-user-plan", updateUserPlanHandler);
    registerCommand(register, "user-usage", getUserUsageHandler);
    registerCommand(register, "user-usage-history", getUserUsageHistoryHandler);

    //consume usage
    registerCommand(register, "consume-usage", consumeUsageHandler);
    

    const args = process.argv.slice(2);

    if (args.length === 0) {
        throw new Error("");
    }

    const cmdName = args[0];
    const cmdArgs = args.slice(1);

    await runCommand(register, cmdName, ...cmdArgs);
    process.exit(0);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
