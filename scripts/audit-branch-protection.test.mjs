import assert from "node:assert/strict";
import test from "node:test";

import {
  GITHUB_ACTIONS_APP_ID,
  REQUIRED_CHECK,
  auditBranchProtection,
} from "./audit-branch-protection.mjs";

function protectedMain(overrides = {}) {
  return {
    required_status_checks: {
      strict: true,
      contexts: [],
      checks: [{ context: REQUIRED_CHECK, app_id: GITHUB_ACTIONS_APP_ID }],
    },
    enforce_admins: { enabled: true },
    ...overrides,
  };
}

test("accepts the required release protection", () => {
  assert.deepEqual(auditBranchProtection(protectedMain()), []);
});

test("rejects contexts-only protection because it is not app-bound", () => {
  assert.deepEqual(
    auditBranchProtection(
      protectedMain({
        required_status_checks: {
          strict: true,
          contexts: [REQUIRED_CHECK],
          checks: [],
        },
      }),
    ),
    [`required status check "${REQUIRED_CHECK}" is missing`],
  );
});

test("rejects the required check when it is bound to the wrong app", () => {
  assert.deepEqual(
    auditBranchProtection(
      protectedMain({
        required_status_checks: {
          strict: true,
          contexts: [REQUIRED_CHECK],
          checks: [{ context: REQUIRED_CHECK, app_id: 1 }],
        },
      }),
    ),
    [
      `required status check "${REQUIRED_CHECK}" is bound to app ID 1 instead of GitHub Actions app ID ${GITHUB_ACTIONS_APP_ID}`,
    ],
  );
});

test("rejects the required check when its app binding is missing", () => {
  assert.deepEqual(
    auditBranchProtection(
      protectedMain({
        required_status_checks: {
          strict: true,
          contexts: [REQUIRED_CHECK],
          checks: [{ context: REQUIRED_CHECK, app_id: null }],
        },
      }),
    ),
    [
      `required status check "${REQUIRED_CHECK}" is bound to app ID null instead of GitHub Actions app ID ${GITHUB_ACTIONS_APP_ID}`,
    ],
  );
});

test("reports every weakened protection setting", () => {
  assert.deepEqual(
    auditBranchProtection(
      protectedMain({
        required_status_checks: {
          strict: false,
          contexts: [],
          checks: [{ context: "A different check" }],
        },
        enforce_admins: { enabled: false },
      }),
    ),
    [
      `required status check "${REQUIRED_CHECK}" is missing`,
      "strict branch freshness is not enabled",
      "administrator enforcement is not enabled",
    ],
  );
});

test("reports absent protection sections clearly", () => {
  assert.deepEqual(auditBranchProtection({}), [
    `required status check "${REQUIRED_CHECK}" is missing`,
    "strict branch freshness is not enabled",
    "administrator enforcement is not enabled",
  ]);
});