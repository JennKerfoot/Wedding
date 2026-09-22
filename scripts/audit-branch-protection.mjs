import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const REQUIRED_CHECK = "Wedding website release validation";
export const GITHUB_ACTIONS_APP_ID = 15368;

export function auditBranchProtection(protection) {
  const failures = [];
  const statusChecks = protection?.required_status_checks;
  const configuredChecks = Array.isArray(statusChecks?.checks)
    ? statusChecks.checks
    : [];
  const requiredCheck = configuredChecks.find(
    (check) => check?.context === REQUIRED_CHECK,
  );

  if (!requiredCheck) {
    failures.push(`required status check "${REQUIRED_CHECK}" is missing`);
  } else if (requiredCheck.app_id !== GITHUB_ACTIONS_APP_ID) {
    failures.push(
      `required status check "${REQUIRED_CHECK}" is bound to app ID ${String(requiredCheck.app_id)} instead of GitHub Actions app ID ${GITHUB_ACTIONS_APP_ID}`,
    );
  }

  if (statusChecks?.strict !== true) {
    failures.push("strict branch freshness is not enabled");
  }

  if (protection?.enforce_admins?.enabled !== true) {
    failures.push("administrator enforcement is not enabled");
  }

  return failures;
}

async function main(filePath) {
  if (!filePath) {
    throw new Error("Usage: node scripts/audit-branch-protection.mjs <protection-json>");
  }

  const protection = JSON.parse(await readFile(filePath, "utf8"));
  const failures = auditBranchProtection(protection);

  if (failures.length > 0) {
    console.error("Wedding release protection audit failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Wedding release protection is intact: "${REQUIRED_CHECK}" is bound to GitHub Actions app ID ${GITHUB_ACTIONS_APP_ID}, strict freshness is enabled, and administrators are enforced.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv[2]).catch((error) => {
    console.error(`Wedding release protection audit could not run: ${error.message}`);
    process.exitCode = 1;
  });
}