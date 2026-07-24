import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("accepts valid runtime config", () => {
  const result = importConfig({
    ADDON_BASE_URL: "https://example.com/fpp/",
    PORT: "8080"
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "https://example.com/fpp 8080");
});

test("rejects invalid ADDON_BASE_URL", () => {
  const result = importConfig({
    ADDON_BASE_URL: "ftp://example.com/fpp",
    PORT: "8080"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid ADDON_BASE_URL protocol/);
});

test("rejects invalid PORT", () => {
  const result = importConfig({
    ADDON_BASE_URL: "https://example.com/fpp",
    PORT: "70000"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid PORT value/);
});

function importConfig(env) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "import('./src/config.js').then(({ BASE_URL, ADDON_PORT }) => console.log(BASE_URL, ADDON_PORT))"
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        ...env
      }
    }
  );
}
