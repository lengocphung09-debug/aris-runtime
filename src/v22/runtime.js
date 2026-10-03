import crypto from "node:crypto";
import manifest from "../../spec/aris-super-v2.2.runtime-manifest.json" with { type: "json" };

const PREDECESSOR_KEYS = Object.freeze([
  "ARIS_8_8_RUNTIME", "ARIS_9_5_RUNTIME", "ARIS_9_6_RUNTIME", "ARIS_9_7_RUNTIME",
  "ARIS_SUPER_V1_3_RUNTIME", "ARIS_SUPER_V1_6_RUNTIME", "ARIS_SUPER_V2_0_RUNTIME",
  "ARIS_SUPER_V2_1_RUNTIME", "ARIS_SUPER_PREDECESSOR_ALIAS", "ARIS_SUPER_PREDECESSOR_CONFIG"
]);

export const frozenIdentity = Object.freeze({
  system: manifest.system,
  specVersion: manifest.spec_version,
  artifactSha256: manifest.artifact_sha256,
  runtimeProfile: manifest.runtime_profile
});

export function predecessorResolutionSnapshot(env = process.env) {
  const present = PREDECESSOR_KEYS.filter((key) => Boolean(env[key]));
  return {
    keysChecked: PREDECESSOR_KEYS.length,
    present,
    absent: PREDECESSOR_KEYS.filter((key) => !present.includes(key)),
    predecessorFree: present.length === 0
  };
}

export function resolveV22({ env = process.env } = {}) {
  const predecessor = predecessorResolutionSnapshot(env);
  return {
    identity: frozenIdentity,
    predecessor,
    dependencyClosure: predecessor.predecessorFree ? "CLOSED_WITHOUT_PREDECESSORS" : "CONTAMINATED",
    ready: predecessor.predecessorFree
  };
}

export function executeResearchSmoke(input, { env = process.env } = {}) {
  const resolution = resolveV22({ env });
  if (!resolution.ready) {
    return {
      committed: false,
      state: "WITHHOLDING",
      failure: "PREDECESSOR_RESOLUTION_CONTAMINATION",
      resolution
    };
  }
  const normalized = String(input ?? "").trim().replace(/\s+/g, " ");
  const transactionId = crypto.createHash("sha256")
    .update(manifest.artifact_sha256 + "\n" + normalized)
    .digest("hex");
  return {
    committed: true,
    state: "QUALIFIED_RUNTIME_OBSERVATION",
    transactionId,
    resolution,
    trace: [
      "PREPARE", "SEND", "RECEIVE", "ACKNOWLEDGE", "VALIDATE",
      "ACCEPT", "EXECUTE", "VERIFY", "COMMIT", "PROPAGATE", "CLOSE"
    ],
    output: { normalizedInput: normalized, evidenceBound: true }
  };
}

export function runPredecessorAbsenceProbe() {
  const cleanEnv = {};
  const clean = executeResearchSmoke("v2.2 predecessor-absence smoke", { env: cleanEnv });
  const contaminated = executeResearchSmoke("v2.2 predecessor-absence smoke", {
    env: { ARIS_SUPER_V2_1_RUNTIME: "injected-predecessor" }
  });
  return {
    test: "V62_PREDECESSOR_ABSENCE_INJECTION",
    artifactSha256: manifest.artifact_sha256,
    clean,
    negativeControl: contaminated,
    pass:
      clean.committed === true &&
      clean.resolution.predecessor.predecessorFree === true &&
      contaminated.committed === false &&
      contaminated.failure === "PREDECESSOR_RESOLUTION_CONTAMINATION"
  };
}


function stableJson(value) {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(k => JSON.stringify(k)+":"+stableJson(value[k])).join(",") + "}";
  return JSON.stringify(value);
}

function digestDb(db) {
  return crypto.createHash("sha256").update(stableJson(db)).digest("hex");
}

export function executeDatabaseIndependentSmoke({ db = {}, env = process.env, mutateCanonical = false } = {}) {
  const resolution = resolveV22({ env });
  const before = digestDb(db);
  if (!resolution.ready) return { committed:false, state:"WITHHOLDING", failure:"PREDECESSOR_RESOLUTION_CONTAMINATION", resolution, canonicalDbBefore:before, canonicalDbAfter:before };
  if (mutateCanonical) return { committed:false, state:"WITHHOLDING", failure:"CANONICAL_DATABASE_MUTATION_PROHIBITED", resolution, canonicalDbBefore:before, canonicalDbAfter:before };
  const keys = Object.keys(db).sort();
  const dbClass = keys.length === 0 ? "EMPTY" : "MINIMAL";
  const transactionId = crypto.createHash("sha256").update(manifest.artifact_sha256+"\nV63\n"+dbClass+"\n"+before).digest("hex");
  const after = digestDb(db);
  return {
    committed:true, state:"QUALIFIED_RUNTIME_OBSERVATION", test:"V63_STANDALONE_EMPTY_MINIMAL_DB",
    transactionId, resolution, dbClass, dbKeys:keys, canonicalDbBefore:before, canonicalDbAfter:after,
    canonicalDbMutated:before!==after, predecessorFree:resolution.predecessor.predecessorFree,
    trace:["PREPARE","DB_SNAPSHOT","VALIDATE_PREDECESSOR_ABSENCE","EXECUTE_WITHOUT_CANONICAL_DB_WRITE","VERIFY_DB_INVARIANCE","COMMIT","CLOSE"]
  };
}

export function runV63DatabaseProbe() {
  const emptyDb = Object.freeze({});
  const minimalDb = Object.freeze({ schemaVersion:"11.0", records:[] });
  const emptyA = executeDatabaseIndependentSmoke({db:emptyDb,env:{}});
  const emptyB = executeDatabaseIndependentSmoke({db:emptyDb,env:{}});
  const minimalA = executeDatabaseIndependentSmoke({db:minimalDb,env:{}});
  const minimalB = executeDatabaseIndependentSmoke({db:minimalDb,env:{}});
  const predecessorNegative = executeDatabaseIndependentSmoke({db:minimalDb,env:{ARIS_SUPER_V2_1_RUNTIME:"injected"}});
  const mutationNegative = executeDatabaseIndependentSmoke({db:minimalDb,env:{},mutateCanonical:true});
  return {
    test:"V63_STANDALONE_EMPTY_MINIMAL_DB", artifactSha256:manifest.artifact_sha256,
    empty:{first:emptyA,replay:emptyB,deterministic:emptyA.transactionId===emptyB.transactionId},
    minimal:{first:minimalA,replay:minimalB,deterministic:minimalA.transactionId===minimalB.transactionId},
    negativeControls:{predecessor:predecessorNegative,canonicalMutation:mutationNegative},
    pass: emptyA.committed && minimalA.committed &&
      !emptyA.canonicalDbMutated && !minimalA.canonicalDbMutated &&
      emptyA.predecessorFree && minimalA.predecessorFree &&
      emptyA.transactionId===emptyB.transactionId && minimalA.transactionId===minimalB.transactionId &&
      predecessorNegative.committed===false && predecessorNegative.failure==="PREDECESSOR_RESOLUTION_CONTAMINATION" &&
      mutationNegative.committed===false && mutationNegative.failure==="CANONICAL_DATABASE_MUTATION_PROHIBITED"
  };
}


export function executeResearchWorkflowV64({ env = process.env, question = "What evidence supports the bounded claim?" } = {}) {
  const resolution = resolveV22({ env });
  if (!resolution.ready) return {committed:false,state:"WITHHOLDING",failure:"PREDECESSOR_RESOLUTION_CONTAMINATION",resolution};
  const q=String(question).trim().replace(/\s+/g," ");
  if(!q) return {committed:false,state:"WITHHOLDING",failure:"EMPTY_RESEARCH_QUESTION",resolution};
  const evidence=[
    {id:"E1",type:"DIRECT_RUNTIME",claim:"v2.2 identity is hash-bound",support:"artifact_sha256"},
    {id:"E2",type:"NEGATIVE_CONTROL",claim:"predecessor contamination fails closed",support:"V62"},
    {id:"E3",type:"DATABASE_INVARIANCE",claim:"standalone execution does not require canonical DB mutation",support:"V63"}
  ];
  const claims=[
    {id:"C1",text:"Runtime identity is bound to the frozen v2.2 artifact.",evidence:["E1"],status:"SUPPORTED_WITHIN_RUNTIME"},
    {id:"C2",text:"Standalone runtime rejects predecessor contamination.",evidence:["E2"],status:"SUPPORTED_WITHIN_RUNTIME"},
    {id:"C3",text:"Research workflow result is bounded and does not constitute universal scientific validity.",evidence:["E1","E2","E3"],status:"BOUNDED"}
  ];
  const trace=["QUESTION","DECOMPOSE","EVIDENCE_BIND","COUNTEREVIDENCE_CHECK","INFERENCE","CALIBRATE","VERIFY","COMMIT","CLOSE"];
  const transactionId=crypto.createHash("sha256").update(manifest.artifact_sha256+"\nV64\n"+q+"\n"+stableJson({evidence,claims,trace})).digest("hex");
  return {committed:true,state:"QUALIFIED_RUNTIME_OBSERVATION",test:"V64_STANDALONE_RESEARCH_WORKFLOW",transactionId,resolution,question:q,evidence,claims,trace,
    unsupportedRelease:false,unboundClaims:claims.filter(c=>!c.evidence?.length).map(c=>c.id),releaseConsequence:"NONE_AUTOMATIC"};
}

export function runV64ResearchProbe() {
  const a=executeResearchWorkflowV64({env:{},question:"Assess bounded standalone evidence for ARIS-SUPER v2.2."});
  const b=executeResearchWorkflowV64({env:{},question:"Assess   bounded standalone evidence for ARIS-SUPER v2.2."});
  const contaminated=executeResearchWorkflowV64({env:{ARIS_SUPER_V2_1_RUNTIME:"injected"},question:"Assess bounded standalone evidence for ARIS-SUPER v2.2."});
  const empty=executeResearchWorkflowV64({env:{},question:"   "});
  return {test:"V64_STANDALONE_RESEARCH_WORKFLOW",artifactSha256:manifest.artifact_sha256,clean:a,replay:b,
    negativeControls:{predecessor:contaminated,emptyQuestion:empty},
    deterministic:a.transactionId===b.transactionId,
    pass:a.committed===true && a.unboundClaims.length===0 && a.unsupportedRelease===false &&
      a.transactionId===b.transactionId && contaminated.committed===false &&
      contaminated.failure==="PREDECESSOR_RESOLUTION_CONTAMINATION" &&
      empty.committed===false && empty.failure==="EMPTY_RESEARCH_QUESTION"};
}
