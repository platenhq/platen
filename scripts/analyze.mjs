// Runs a production build with the bundle analyzer enabled. A script instead of an inline
// `ANALYZE=true` so it works the same in Windows shells and Bash.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ANALYZE: "true" },
});
process.exit(result.status ?? 1);
