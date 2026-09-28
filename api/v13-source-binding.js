import crypto from "crypto";
import { readFileSync } from "fs";

const profile = JSON.parse(readFileSync(new URL("../spec/aris-super-v1.3.runtime-profile.json", import.meta.url), "utf8"));
const binding = JSON.parse(readFileSync(new URL("../spec/aris-super-v1.3.source-binding.json", import.meta.url), "utf8"));

export default function handler(req, res) {
  const execution_id = crypto.randomUUID();
  const observed_at = new Date().toISOString();
  const checks = {
    spec_version_match: profile.spec_version === binding.spec_version,
    spec_hash_match: profile.spec_sha256 === binding.source_sha256,
    library_file_id_match: profile.source_library_file_id === binding.source_library_file_id,
    source_size_bound: binding.source_size_bytes === 323380,
    self_authorizing_false: profile.self_authorizing === false && binding.self_authorizing === false
  };
  const source_binding_pass = Object.values(checks).every(Boolean);
  res.status(source_binding_pass ? 200 : 409).json({
    system: "ARIS-SUPER v1.3 source-binding gate",
    execution_id,
    observed_at,
    checks,
    source_binding_pass,
    source_sha256: binding.source_sha256,
    source_size_bytes: binding.source_size_bytes,
    next_gates: {
      protected_inventory_152_execution: "NOT_EXECUTED",
      c01_c50_conformance: "NOT_EXECUTED",
      pexv: "NOT_EXECUTED",
      pbench: "NOT_EXECUTED",
      bcl: "NOT_EXECUTED",
      qnr: "NOT_EXECUTED",
      rer: "NOT_EXECUTED",
      iba: "NOT_EXECUTED"
    },
    release_status: "WITHHELD",
    epistemic_boundary: binding.epistemic_boundary
  });
}