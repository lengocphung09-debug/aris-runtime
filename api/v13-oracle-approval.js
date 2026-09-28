import crypto from "crypto";
import { readFileSync } from "fs";
const contractBytes=readFileSync(new URL("../spec/aris-super-v1.3.normative-oracle-contract.proposed.json",import.meta.url));
const c=JSON.parse(contractBytes.toString("utf8"));
const a=JSON.parse(readFileSync(new URL("../spec/aris-super-v1.3.oracle-approval.json",import.meta.url),"utf8"));
const sha256=x=>crypto.createHash("sha256").update(x).digest("hex");
export default function handler(req,res){
 const contract_sha256=sha256(contractBytes);
 const checks={
  contract_identity:a.contract_id===c.contract_id,
  human_owner_approval:a.decision==="APPROVED_AS_NORMATIVE_CONTRACT_WITH_EXPLICIT_BLOCKERS",
  blockers_exact:["C38","C45","C46"].every(x=>a.unresolved_thresholds.includes(x))&&a.unresolved_thresholds.length===3,
  no_release_authorization:a.release_authorization===false,
  no_self_authorization:a.self_authorizing===false
 };
 const approval_binding_pass=Object.values(checks).every(Boolean);
 res.status(approval_binding_pass?200:409).json({system:"ARIS-SUPER v1.3 normative oracle approval binding",execution_id:crypto.randomUUID(),observed_at:new Date().toISOString(),checks,approval_binding_pass,contract_sha256,approved_normative_contract:approval_binding_pass,unresolved_thresholds:a.unresolved_thresholds,next_gate:"ORACLE_COMPILATION_AND_EXECUTION",release_status:"WITHHELD",epistemic_boundary:"Human approval authorizes this contract's normative role but does not itself establish any C01-C50 test result or release eligibility."});
}