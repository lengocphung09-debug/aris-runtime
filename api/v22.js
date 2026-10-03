import { runPredecessorAbsenceProbe, runV63DatabaseProbe, runV64ResearchProbe, runV65KernelProbe, runV66CoreProbe, runV67VlfProbe, runV68CounterProbe, runV69SiblingNonInterferenceProbe, executeResearchSmoke, frozenIdentity } from "../src/v22/runtime.js";

export default function handler(req, res) {
  const mode = req.query?.mode || "identity";
  if (mode === "absence") return res.status(200).json(runPredecessorAbsenceProbe());
  if (mode === "v63") return res.status(200).json(runV63DatabaseProbe());
  if (mode === "v64") return res.status(200).json(runV64ResearchProbe());
  if (mode === "v65") return res.status(200).json(runV65KernelProbe());
  if (mode === "v66") return res.status(200).json(runV66CoreProbe());
  if (mode === "v67") return res.status(200).json(runV67VlfProbe());
  if (mode === "v68") return res.status(200).json(runV68CounterProbe());
  if (mode === "v69") return runV69SiblingNonInterferenceProbe().then(x=>res.status(200).json(x));
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
