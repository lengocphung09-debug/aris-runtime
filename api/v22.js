import { runPredecessorAbsenceProbe, executeResearchSmoke, frozenIdentity } from "../src/v22/runtime.js";

export default function handler(req, res) {
  const mode = req.query?.mode || "identity";
  if (mode === "absence") return res.status(200).json(runPredecessorAbsenceProbe());
  if (mode === "smoke") return res.status(200).json(executeResearchSmoke(req.query?.input || "ARIS-SUPER v2.2 standalone smoke"));
  return res.status(200).json({
    system: frozenIdentity.system,
    spec_version: frozenIdentity.specVersion,
    artifact_sha256: frozenIdentity.artifactSha256,
    runtime_profile: frozenIdentity.runtimeProfile,
    self_authorizing: false,
    release_state: "WITHHOLDING"
  });
}
