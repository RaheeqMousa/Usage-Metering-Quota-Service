CREATE TYPE "public"."plan_type" AS ENUM('predefined', 'custom');--> statement-breakpoint
ALTER TABLE "plan" ADD COLUMN "type" "plan_type" DEFAULT 'predefined' NOT NULL;