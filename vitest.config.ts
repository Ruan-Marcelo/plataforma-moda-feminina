// RUAN MARCELO RAMACIOTI LUZ
import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "vitest/config";

const projectRoot = fs.realpathSync(process.cwd());

export default defineConfig({
  root: projectRoot,
  resolve: { alias: { "@": path.join(projectRoot, "src") } },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
