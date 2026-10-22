import { defineConfig } from "vitest/config";
// One file at a time: the database tests share one PostgreSQL.
export default defineConfig({ test: { environment: "node", fileParallelism: false } });
