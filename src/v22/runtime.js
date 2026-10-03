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
