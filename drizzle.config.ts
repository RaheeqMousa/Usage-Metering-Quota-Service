import { defineConfig } from "drizzle-kit";
import {env} from './src/config/env.ts';

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.dbURL,
  },
});
