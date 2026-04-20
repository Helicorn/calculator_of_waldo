const { spawnSync } = require("node:child_process");
const path = require("node:path");

const backend = path.join(__dirname, "..", "backend");
const win = process.platform === "win32";
const cmd = win ? "mvnw.cmd" : "./mvnw";

const env = { ...process.env };
const portArg = process.argv[2];
if (portArg && /^\d+$/.test(portArg)) {
  env.SERVER_PORT = portArg;
}

const result = spawnSync(cmd, ["spring-boot:run"], {
  cwd: backend,
  stdio: "inherit",
  shell: win,
  env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
