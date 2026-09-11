import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gitDir = path.resolve(__dirname, "..", ".git");
const indexPath = path.join(gitDir, "index");
const lockPath = path.join(gitDir, "index.lock");

console.log("🔧 Checking Git index health...");

if (fs.existsSync(lockPath)) {
  try {
    fs.unlinkSync(lockPath);
    console.log("✓ Removed stale .git/index.lock");
  } catch (e) {
    console.warn("Could not remove index.lock:", e.message);
  }
}

let isCorrupted = false;
if (fs.existsSync(indexPath)) {
  const stats = fs.statSync(indexPath);
  if (stats.size < 12) {
    console.log(
      `⚠️ Detected damaged/empty .git/index (size: ${stats.size} bytes).`,
    );
    isCorrupted = true;
  }
}

try {
  execSync("git status", { stdio: "pipe" });
} catch (err) {
  isCorrupted = true;
}

if (isCorrupted) {
  console.log("🔄 Repairing damaged .git/index...");
  try {
    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath);
    }
    execSync("git reset", { stdio: "inherit" });
    console.log("✅ Git index successfully rebuilt!");
  } catch (err) {
    console.error("❌ Failed to repair git index:", err.message);
  }
} else {
  console.log("✅ Git index is clean and healthy (no repairs needed).");
}
