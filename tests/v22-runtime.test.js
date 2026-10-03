import test from "node:test";
import assert from "node:assert/strict";
import { frozenIdentity, resolveV22, executeResearchSmoke, runPredecessorAbsenceProbe, runV63DatabaseProbe, runV64ResearchProbe, runV65KernelProbe, runV66CoreProbe, runV67VlfProbe, runV68CounterProbe, runV69SiblingNonInterferenceProbe, runV34V38DebuggingLab, runV39V44HallucinationLab, runV77V80EmpiricalSuite, runV33RetryProbe, runV79V80ComparableBaseline, runV83AssuranceGate, runV84FinalVerdict } from "../src/v22/runtime.js";

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

test("V65-V68 identity-bound sibling contracts preserve authority separation", () => {
 for (const fn of [runV65KernelProbe,runV66CoreProbe,runV67VlfProbe,runV68CounterProbe]) {
   const r=fn(); assert.equal(r.pass,true); assert.equal(r.result.negative.accepted,false);
 }
});
test("V69 application-level async sibling probe is non-interfering", async () => {
 const r=await runV69SiblingNonInterferenceProbe();
 assert.equal(r.pass,true); assert.equal(r.manifestInvariant,true); assert.equal(r.distinctAuthorities,4);
 assert.equal(r.executionModel,"APPLICATION_LEVEL_ASYNC_OVERLAP_NOT_PHYSICAL_SCHEDULER_PROOF");
});

test("V33 bounded retry terminates without orphan",()=>{const r=runV33RetryProbe();assert.equal(r.pass,true);});
test("V34-V38 debugging public corpus is deterministic",()=>{const r=runV34V38DebuggingLab();assert.equal(r.pass,true);assert.equal(r.rootCausePrecision,1);});
test("V39-V44 hallucination public corpus fails unsupported claims closed",()=>{const r=runV39V44HallucinationLab();assert.equal(r.pass,true);assert.equal(r.unsupportedWithholdRecall,1);});
test("V77-V80 empirical suite reports paired measurement without fabricating missing baselines",()=>{const r=runV77V80EmpiricalSuite();assert.equal(r.V78.paired,true);assert.equal(r.V79.pass,false);assert.equal(r.V80.pass,false);});

test("V79-V80 semantic adapter baseline remains explicitly bounded",()=>{const r=runV79V80ComparableBaseline();assert.equal(r.pass,true);assert.match(r.baselineIdentity,/SEMANTIC_COMPATIBILITY_ADAPTER/);});
test("V83-V84 preserve withholding while material defeaters remain",()=>{const a=runV83AssuranceGate(),v=runV84FinalVerdict();assert.equal(a.releaseState,"WITHHOLDING");assert.ok(a.openDefeaters.length>0);assert.equal(v.universalCorrectnessClaimed,false);});
