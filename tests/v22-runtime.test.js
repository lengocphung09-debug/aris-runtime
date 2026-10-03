import test from "node:test";
import assert from "node:assert/strict";
import { frozenIdentity, resolveV22, executeResearchSmoke, runPredecessorAbsenceProbe, runV63DatabaseProbe, runV64ResearchProbe } from "../src/v22/runtime.js";

const SHA = "5128655194f4af19291abe9b1bc5bc6adafc7addbe56af6dea925c15a037a20f";

test("v2.2 frozen identity binding", () => {
  assert.equal(frozenIdentity.artifactSha256, SHA);
  assert.equal(frozenIdentity.specVersion, "2.2");
});

test("V62 predecessor absence injection", () => {
  const r = runPredecessorAbsenceProbe();
  assert.equal(r.pass, true);
  assert.equal(r.clean.committed, true);
  assert.equal(r.clean.resolution.dependencyClosure, "CLOSED_WITHOUT_PREDECESSORS");
  assert.equal(r.negativeControl.committed, false);
});

test("predecessor contamination fails closed", () => {
  const r = resolveV22({ env: { ARIS_9_7_RUNTIME: "present" } });
  assert.equal(r.ready, false);
  assert.deepEqual(r.predecessor.present, ["ARIS_9_7_RUNTIME"]);
});

test("standalone smoke is deterministic", () => {
  const a = executeResearchSmoke("  alpha   beta ", { env: {} });
  const b = executeResearchSmoke("alpha beta", { env: {} });
  assert.equal(a.committed, true);
  assert.equal(a.transactionId, b.transactionId);
  assert.deepEqual(a.trace, b.trace);
});

test("V63 empty/minimal DB standalone oracle is deterministic and fail-closed", () => {
  const r = runV63DatabaseProbe();
  assert.equal(r.pass, true);
  assert.equal(r.empty.first.dbClass, "EMPTY");
  assert.equal(r.minimal.first.dbClass, "MINIMAL");
  assert.equal(r.empty.first.canonicalDbMutated, false);
  assert.equal(r.minimal.first.canonicalDbMutated, false);
  assert.equal(r.empty.deterministic, true);
  assert.equal(r.minimal.deterministic, true);
  assert.equal(r.negativeControls.predecessor.failure, "PREDECESSOR_RESOLUTION_CONTAMINATION");
  assert.equal(r.negativeControls.canonicalMutation.failure, "CANONICAL_DATABASE_MUTATION_PROHIBITED");
});

test("V64 standalone research workflow binds claims to evidence and fails closed", () => {
 const r=runV64ResearchProbe();
 assert.equal(r.pass,true);
 assert.equal(r.clean.committed,true);
 assert.deepEqual(r.clean.unboundClaims,[]);
 assert.equal(r.clean.unsupportedRelease,false);
 assert.equal(r.deterministic,true);
 assert.equal(r.negativeControls.predecessor.failure,"PREDECESSOR_RESOLUTION_CONTAMINATION");
 assert.equal(r.negativeControls.emptyQuestion.failure,"EMPTY_RESEARCH_QUESTION");
});
