import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./src/lib/test/setup.ts"], pool: "forks", maxWorkers: 1, coverage: { reporter: ["text", "json"] } },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
