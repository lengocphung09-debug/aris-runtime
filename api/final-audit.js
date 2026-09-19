import {runConformance} from '../src/conformance.js';import {signManifest,sha256} from '../src/runtime.js';

async function getJson(url){const r=await fetch(url,{cache:'no-store'});let body=null;try{body=await r.json();}catch{}return {ok:r.ok,status:r.status,body};}

export default async function handler(req,res){
  const origin=`https://${req.headers.host}`;
  const started=Date.now();
  const local=runConformance();
  const [runtime,adversarial,provenance,concurrency]=await Promise.all([
    getJson(`${origin}/api/runtime`),
    getJson(`${origin}/api/adversarial-test`),
    getJson(`${origin}/api/provenance-test`),
    getJson(`${origin}/api/concurrency-test?count=5`)
  ]);
  const checks={
    local_conformance_112:local.total===112&&local.pass===112&&local.fail===0,
    runtime_observed:runtime.ok&&runtime.body?.status==='OBSERVED'&&runtime.body?.conformance?.pass===112&&runtime.body?.conformance?.fail===0&&runtime.body?.signed?.valid===true,
    adversarial_pass:adversarial.ok&&adversarial.body?.status==='PASS_BOUNDED'&&adversarial.body?.failed===0,
    provenance_pass:provenance.ok&&provenance.body?.status==='PASS_BOUNDED'&&provenance.body?.checks?.release_fail_closed===true,
    concurrency_pass:concurrency.ok&&concurrency.body?.concurrent_overlap_observed===true&&concurrency.body?.all_runtime_checks_pass===true&&concurrency.body?.unique_execution_ids===true&&concurrency.body?.unique_manifest_hashes===true
  };
  const technical_runtime_pass=Object.values(checks).every(Boolean);
  const unresolved_release_blockers=[
    'FULL_NORMATIVE_C01_C112_ORACLE_COVERAGE_NOT_INDEPENDENTLY_DEMONSTRATED',
    'VLF_SEMANTIC_COMPATIBILITY_UNVERIFIED_AGAINST_ACCESSIBLE_PROFILE_OR_RUNTIME',
    'TEXT_METRICS_SEMANTIC_COMPATIBILITY_NOT_FULLY_VERIFIED',
    'INDEPENDENT_AUDIT_NOT_PERFORMED_BY_AN_INDEPENDENT_REVIEWER'
  ];
  const release_adjudication='WITHHELD';
  const evidence={runtime:{http:runtime.status,status:runtime.body?.status,execution_id:runtime.body?.observed?.execution_id,signature_valid:runtime.body?.signed?.valid},adversarial:{http:adversarial.status,total:adversarial.body?.total,passed:adversarial.body?.passed,failed:adversarial.body?.failed},provenance:{http:provenance.status,status:provenance.body?.status,execution_id:provenance.body?.execution_id,merkle_root:provenance.body?.merkle_root,signature_valid:provenance.body?.signed?.valid},concurrency:{http:concurrency.status,requested:concurrency.body?.requested,completed:concurrency.body?.completed,max_observed_overlap:concurrency.body?.max_observed_overlap,concurrent_overlap_observed:concurrency.body?.concurrent_overlap_observed,all_runtime_checks_pass:concurrency.body?.all_runtime_checks_pass,durations_ms:Array.isArray(concurrency.body?.results)?concurrency.body.results.map(x=>x.duration_ms):[]}};
  const audit_id=`audit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const manifest={audit_id,checks,technical_runtime_pass,evidence,release_adjudication,unresolved_release_blockers,elapsed_ms:Date.now()-started};
  const signed=signManifest(manifest);
  res.status(technical_runtime_pass?200:500).json({system:'ARIS-9.6 ULTIMATE final integrated runtime audit',audit_id,status:technical_runtime_pass?'TECHNICAL_RUNTIME_PASS_BOUNDED':'TECHNICAL_RUNTIME_FAIL',checks,evidence,elapsed_ms:Date.now()-started,audit_manifest_hash:sha256(manifest),signed:{algorithm:signed.algorithm,manifest_hash:signed.manifest_hash,valid:signed.valid,note:signed.note},release_adjudication,unresolved_release_blockers,final_state:release_adjudication==='WITHHELD'?'WITHHELD':'RELEASED',epistemic_boundary:'A bounded technical runtime pass is not an independent audit, universal correctness proof, or release authorization.'});
}
