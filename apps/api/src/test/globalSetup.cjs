// CJS 格式：Jest globalSetup 在獨立 context 執行，此時 ESM 尚未套用。
// 自行載入 .env（secrets）再以 .env.test 覆蓋 DATABASE_URL，使 prisma 指向 vms_test。
const { execSync } = require("child_process");
const path = require("path");
const { configDotenv } = require("dotenv");

const apiRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(__dirname, "../../../..");
const binPath = path.join(repoRoot, "node_modules", ".bin");

module.exports = async function globalSetup() {
  configDotenv({ path: path.resolve(repoRoot, ".env") });
  configDotenv({ path: path.resolve(apiRoot, ".env.test"), override: true });

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
