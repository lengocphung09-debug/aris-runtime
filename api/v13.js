import crypto from "crypto";
import { readFileSync } from "fs";
import { runV13 } from "../src/v13/harness.js";
import { runBenchmark } from "../src/v13/benchmark.js";
import { runPEXV } from "../src/v13/pexv.js";
import { runPBench } from "../src/v13/pbench.js";
import { run97kBaseline } from "../src/baseline97k/runner.js";
import { runPairedPBench } from "../src/v13/paired-pbench.js";
import { verifyAutomatedGate } from "../src/v13/automated-verifier.js";
import { runBCL } from "../src/v13/bcl.js";
import { runAAV } from "../src/v14/aav.js";
import { runQNR } from "../src/v14/qnr.js";
import { runV13AAQNR } from "../src/v13/qnr-aa01.js";
import { runV13RER } from "../src/v13/rer-aa01.js";
import profile from "../spec/aris-super-v1.3.runtime-profile.json" with {type:"json"};
import { runV13AA } from "../src/v13/automated-assurance-aa01.js";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const sha256=x=>crypto.createHash("sha256").update(x).digest("hex");
export default async function handler(req,res){
 const action=String(req.query.action||"conformance");
 if(action==="conformance") return res.status(200).json(runV13());
 if(action==="pexv") return res.status(200).json(await runPEXV());
 if(action==="pbench") return res.status(200).json(runPBench());
 if(action==="baseline97k") return res.status(200).json(run97kBaseline());
 if(action==="pairedpbench") return res.status(200).json(runPairedPBench());
 if(action==="avg") return res.status(200).json(verifyAutomatedGate());
 if(action==="bcl") return res.status(200).json(runBCL());
 if(action==="aav") return res.status(200).json(runAAV());
 if(action==="qnr") return res.status(200).json(runV13AAQNR());
 if(action==="qnr-v14-legacy") return res.status(200).json(runQNR());
 if(action==="rer") return res.status(200).json(runV13RER());
 if(action==="aa01") return res.status(200).json(runV13AA());
 if(action==="benchmark") return res.status(200).json(runBenchmark());
 if(action==="identity"){const p=profile;const commit=process.env.VERCEL_GIT_COMMIT_SHA||null,url=process.env.VERCEL_URL||null;const complete=Boolean(commit&&url&&p.spec_sha256);return res.status(complete?200:503).json({system:"ARIS-SUPER v1.3 runtime profile",profile_id:p.profile_id,spec_version:p.spec_version,spec_sha256:p.spec_sha256,implementation_hash:commit,implementation_hash_type:"git_commit_sha",deployment_url:url,execution_id:crypto.randomUUID(),observed_at:new Date().toISOString(),binding_complete:complete,evidence_state:complete?"RUNTIME_OBSERVED_IDENTITY_BOUND":"INCOMPLETE",release_status:"WITHHELD"});}
 if(action==="source-binding"){const p=read("../spec/aris-super-v1.3.runtime-profile.json"),b=read("../spec/aris-super-v1.3.source-binding.json");const checks={spec_version_match:p.spec_version===b.spec_version,spec_hash_match:p.spec_sha256===b.source_sha256,library_file_id_match:p.source_library_file_id===b.source_library_file_id,source_size_bound:b.source_size_bytes===323380,self_authorizing_false:b.self_authorizing===false};const pass=Object.values(checks).every(Boolean);return res.status(pass?200:409).json({system:"ARIS-SUPER v1.3 source binding",checks,source_binding_pass:pass,release_status:"WITHHELD"});}
 if(action==="inventory"){const x=read("../spec/aris-super-v1.3.inventory.json");const ids=Object.values(x.groups).flat();const counts=Object.fromEntries(Object.entries(x.groups).map(([k,v])=>[k,v.length]));const pass=ids.length===152&&new Set(ids).size===152;return res.status(pass?200:409).json({system:"ARIS-SUPER v1.3 protected inventory",counts,total:ids.length,unique_ids:new Set(ids).size,protected_inventory_pass:pass,release_status:"WITHHELD"});}
 if(action==="oracle-coverage"){const r=read("../spec/aris-super-v1.3.c01-c50.oracles.json");const ids=r.tests.map(x=>x.test_id);const expected=Array.from({length:50},(_,i)=>"C"+String(i+1).padStart(2,"0"));const pass=r.tests.length===50&&expected.every((x,i)=>ids[i]===x)&&r.source_sha256==="bb406627e31052bde176f33681b056c7c545def7cc87dca3d240178389e4e763";return res.status(pass?200:409).json({system:"ARIS-SUPER v1.3 oracle registry",registry_pass:pass,total:50,release_status:"WITHHELD"});}
 if(action==="proposal"){const c=read("../spec/aris-super-v1.3.normative-oracle-contract.proposed.json");const pass=c.tests.length===50&&c.status==="PROPOSED_NOT_CANONICAL_NOT_SELF_AUTHORIZING";return res.status(pass?200:409).json({system:"ARIS-SUPER v1.3 oracle proposal integrity",proposal_integrity_pass:pass,total:c.tests.length,release_status:"WITHHELD"});}
 if(action==="approval"){const bytes=readFileSync(new URL("../spec/aris-super-v1.3.normative-oracle-contract.proposed.json",import.meta.url));const c=JSON.parse(bytes),a=read("../spec/aris-super-v1.3.oracle-approval.json");const pass=a.contract_id===c.contract_id&&a.decision==="APPROVED_AS_NORMATIVE_CONTRACT_WITH_EXPLICIT_BLOCKERS"&&a.unresolved_thresholds.join(",")==="C38,C45,C46";return res.status(pass?200:409).json({system:"ARIS-SUPER v1.3 normative oracle approval",approval_binding_pass:pass,contract_sha256:sha256(bytes),unresolved_thresholds:a.unresolved_thresholds,release_status:"WITHHELD"});}
 return res.status(404).json({error:"UNKNOWN_ACTION",allowed:["identity","source-binding","inventory","oracle-coverage","proposal","approval","conformance","benchmark","pexv","pbench","baseline97k","pairedpbench"]});
}