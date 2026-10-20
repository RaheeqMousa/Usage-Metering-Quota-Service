import {uuid, integer, pgTable, timestamp, varchar, pgEnum, uniqueIndex, check} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";


export const usageEnum= pgEnum("usage_status",[
    "rejected", "approved"
]);

export const planTypeEnum = pgEnum("plan_type", [
    "predefined",
    "custom",
]);

export const plan= pgTable("plan",{
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    name:varchar("name", { length: 255 }).notNull(),
    monthlyLimit: integer("monthly_limit").notNull(),
    maxUnitsPerRequest: integer("max_units_per_request").notNull(),
    type: planTypeEnum("type")
        .notNull()
        .default("predefined"),
    ownerAccountId: uuid("owner_account_id"),
});

export const account=pgTable("account",{
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    apiKeyHash: varchar("api_key_hash",{length:255}).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    planId: uuid("plan_id").notNull().references(()=>plan.id)
});

export const user= pgTable("user",{
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    name: varchar("name", { length: 255 }).notNull(),
    accountId: uuid("account_id").notNull().references(()=>account.id),
    planId: uuid("plan_id").notNull().references(()=>plan.id)
});

export const usageRequest= pgTable("usage_request",{
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    units: integer("units").notNull(),
    status: usageEnum("status").notNull().default("rejected"),
    requestId: uuid("request_id").notNull(),
    userId: uuid("user_id").notNull().references(()=>user.id),
    accountId: uuid("account_id").notNull().references(()=>account.id)
    },
    (table) => [
        uniqueIndex("usage_request_account_request_unique").on(
        table.accountId,
        table.requestId,
        ),
        check(
        "usage_request_units_positive",
        sql`${table.units} > 0`,
        ),
  ],);


export type newAccount= typeof account.$inferInsert;
export type newUser= typeof user.$inferInsert;
export type newPlan= typeof plan.$inferInsert;
export type newUsageRequest= typeof usageRequest.$inferInsert;