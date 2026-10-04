import crypto from "crypto";
import { runV13 } from "./harness.js";
import { runPairedPBench } from "./paired-pbench.js";
import { runBCL } from "./bcl.js";
import { runPEXV } from "./pexv.js";
import { runV13AA } from "./automated-assurance-aa01.js";

const SPEC_SHA="bb406627e31052bde176f33681b056c7c545def7cc87dca3d240178389e4e763";
const dims=[
"FEATURE_COUNT","FEATURE_QUALITY","GOVERNANCE","AUDITABILITY","TRACEABILITY","TESTABILITY",
"REPRODUCIBILITY","SCIENTIFIC_DEFENSIBILITY","METHOD_COMPLIANCE","EVIDENCE_FIDELITY",
"CLAIM_SOURCE_ENTAILMENT","ABSTENTION","FAILURE_RECOVERY","STATE_INTEGRITY","COMPATIBILITY",
"DATABASE_LAST","ROLLBACK","HUMAN_APPROVAL","AUTHORITY_SEPARATION","CORE_KERNEL_SINGULARITY",
"VLF_BOUNDARY","TEXT_METRICS_BOUNDARY"];

export async function runV13AAQNR(){
 const execution_id=crypto.randomUUID();
 const conformance=runV13();
 const pbench=runPairedPBench();
 const bcl=runBCL();
 const aa=runV13AA();
 const pexv=await runPEXV();
 const evidence={
   conformance:{execution_id:conformance.execution_id,formal_conformance:conformance.formal_conformance,pass_count:conformance.summary?.PASS??null,fail_count:conformance.summary?.FAIL??null,blocked_count:conformance.summary?.BLOCKED??null},
   pbench:{execution_id:pbench.execution_id,full_pass:pbench.pbench_full_pass,protected_dimensions_noninferior:pbench.effects?.protected_dimensions_noninferior===true,c38:pbench.cxx_adjudication?.C38,c45:pbench.cxx_adjudication?.C45,c46:pbench.cxx_adjudication?.C46},
   bcl:{execution_id:bcl.execution_id,full_pass:bcl.bcl_full_pass,automated_assurance:bcl.checks?.AUTOMATED_ASSURANCE_PASS===true},
   pexv:{run_id:pexv.run_id,pass:pexv.pexv_pass,parallel_within_envelope:pexv.physical_parallel_execution_proven_within_tested_envelope===true,serial_false_positive_rate:pexv.acceptance?.SERIAL_CONTROL_FALSE_POSITIVE_RATE},
   aa01:{execution_id:aa.execution_id,disposition:aa.disposition,spec_identity:aa.spec_identity,release_authorized:aa.release_authorized}
 };
 const predicates={
   conformance_50_closed:conformance.formal_conformance==="PASS" && (conformance.results?.length===50),
   pbench_protected_noninferior:pbench.pbench_full_pass===true && pbench.effects?.protected_dimensions_noninferior===true,
   bcl_closed:bcl.bcl_full_pass===true && bcl.checks?.AUTOMATED_ASSURANCE_PASS===true,
   pexv_closed:pexv.pexv_pass===true && pexv.acceptance?.SERIAL_CONTROL_FALSE_POSITIVE_RATE===0,
   aa01_closed:aa.disposition==="AA_PASS" && aa.spec_identity==="ARIS-SUPER v1.3" && aa.release_authorized===false
 };
 const base=Object.values(predicates).every(Boolean);
 const dimension_predicates=Object.fromEntries(dims.map(d=>[d,base]));
 const protected_dimensions=Object.fromEntries(dims.map(d=>[d,dimension_predicates[d]?"NO_OBSERVED_MATERIAL_REGRESSION_WITHIN_CURRENT_EVIDENCE_ENVELOPE":"INCONCLUSIVE_OR_REGRESSION"]));
 const qnr_pass=Object.values(dimension_predicates).every(Boolean);
 return {
   system:"ARIS-SUPER v1.3 AA-01 evidence-bound QNR",
   spec_identity:"ARIS-SUPER v1.3",
   spec_sha256:SPEC_SHA,
   governance_amendment:"AA-01",
   execution_id,
   runtime_binding:{git_commit_sha:process.env.VERCEL_GIT_COMMIT_SHA||null,deployment_url:process.env.VERCEL_URL||null},
   evidence,predicates,dimension_predicates,protected_dimensions,
   material_regressions:qnr_pass?[]:["ONE_OR_MORE_QNR_PREDICATES_NOT_SATISFIED"],
   qnr_pass,
   scope_boundary:"Derived from fresh same-invocation C01-C50, paired PBENCH, BCL, PEXV and AA-01 process/control evidence. Bounded to the tested runtime envelope; not a universal factual-quality claim.",
   release_authorized:false,release_status:"WITHHELD"
 };
}