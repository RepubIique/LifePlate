import { runMigrations, pool } from "./db.js";
import { backfillAllUserMealStats } from "./services/userMealStats.js";

await runMigrations();
await backfillAllUserMealStats();
console.log("Migrations applied.");
await pool.end();
