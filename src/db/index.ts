import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";
import {env} from "../config/env.js";

const conn = postgres(env.dbURL);
export const db = drizzle(conn, { schema });