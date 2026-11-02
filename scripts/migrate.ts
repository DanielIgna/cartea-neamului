import { db } from "../src/db";
import { runMigrations } from "../src/db/migrate";
await runMigrations(db);
console.log("Schema aplicată.");
process.exit(0);
