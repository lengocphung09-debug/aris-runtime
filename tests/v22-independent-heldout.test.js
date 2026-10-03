import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

test("V38/V42/V44 independent source-bound held-out bridge",()=>{
  const r=spawnSync(process.execPath,["scripts/independent-v22-heldout-evaluator.js"],{encoding:"utf8",env:{...process.env,GITHUB_RUN_ID:process.env.GITHUB_RUN_ID||"ci-heldout"}});
  assert.equal(r.status,0,r.stderr||r.stdout);
  const e=JSON.parse(fs.readFileSync("evidence/v22-independent-heldout-result.json","utf8"));
  assert.equal(e.V38.pass,true);
  assert.equal(e.V42.pass,true);
  assert.equal(e.V44.pass,true);
  assert.equal(e.pass,true);
  assert.equal(e.provenance.historicalV21ExecutableClaimed,false);
});
