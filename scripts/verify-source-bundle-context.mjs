#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "..");
const bundle = join(repo, "docs/source-bundle/stitch_scale_bundle-2026-08-22");
const archive = join(bundle, "stitch_scale_bundle.zip");
const sourceDir = join(bundle, "original");
const manifest = join(bundle, "source-sha256s.txt");
const expectedArchiveSha = "c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082";
const expectedFiles = [
  "README.txt",
  "calc_yarn_scenarios.py",
  "stitch_scale_access_research.md",
  "stitch_scale_beta_access_architecture.md",
  "stitch_scale_beta_launch_playbook.md",
  "stitch_scale_beta_research.md",
  "stitch_scale_economics.py",
  "stitch_scale_feedback_system_recommendation.md",
  "stitch_scale_observations.md",
  "stitch_scale_pricing_model.py",
  "stitch_scale_research.md",
  "stitch_scale_risk_pricing.md",
  "stitch_scale_risk_pricing_report.md",
  "stitch_scale_validation_report.md",
  "yarn_shopping_findings.md",
];

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fail(message) {
  console.error(`SOURCE_BUNDLE_CONTEXT_FAILED: ${message}`);
  process.exit(1);
}

for (const path of [join(bundle, "README.md"), archive, sourceDir, manifest]) {
  if (!existsSync(path)) fail(`missing ${path}`);
}

if (sha256(archive) !== expectedArchiveSha) {
  fail(`archive hash mismatch for ${archive}`);
}

const actualFiles = readdirSync(sourceDir).filter((name) => statSync(join(sourceDir, name)).isFile()).sort();
if (actualFiles.join("\n") !== expectedFiles.slice().sort().join("\n")) {
  fail(`raw source inventory mismatch; expected ${expectedFiles.length} files and found ${actualFiles.length}`);
}

const manifestRows = new Map(
  readFileSync(manifest, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+\s/))
    .filter(([hash, path]) => Boolean(hash && path))
    .map(([hash, path]) => [path, hash]),
);
for (const name of expectedFiles) {
  const path = join(sourceDir, name);
  const actualSha = sha256(path);
  if (manifestRows.get(name) !== actualSha) {
    fail(`source hash mismatch for original/${name}`);
  }
}

console.log(`SOURCE_BUNDLE_CONTEXT_VERIFIED archive=${expectedArchiveSha} files=${expectedFiles.length}`);
console.log("Raw files are present and fingerprinted. A separate human/agent reading receipt is still required; this command does not replace reading the files.");
