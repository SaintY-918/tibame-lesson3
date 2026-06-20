// CJS 格式：Jest globalSetup 在獨立 context 執行，此時 ESM 尚未套用
// DATABASE_URL 已由 dotenv-cli 注入 process.env（.env.test），prisma 直接讀取
const { execSync } = require("child_process");
const path = require("path");

const apiRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(__dirname, "../../../..");
const binPath = path.join(repoRoot, "node_modules", ".bin");

module.exports = async function globalSetup() {
  const env = {
    ...process.env,
    PATH: `${binPath}${path.delimiter}${process.env.PATH ?? ""}`,
  };
  // migrate deploy：若 vms_test 不存在，Prisma 會自動建立；已套用的 migration 不重跑
  execSync("prisma migrate deploy", {
    cwd: apiRoot,
    env,
    stdio: "inherit",
    shell: true,
  });
};
