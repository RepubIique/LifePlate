import { runMigrations, pool } from "./db.js";

await runMigrations();
console.log("Migrations applied.");
await pool.end();
