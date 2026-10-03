import fs from 'node:fs';
import crypto from 'node:crypto';

const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');
const read = p => fs.readFileSync(p,'utf8');
const json = p => JSON.parse(read(p));
const fail = reason => { console.error(JSON.stringify({status:'FAIL_CLOSED',reason},null,2)); process.exit(1); };

const contract=json('spec/aris-9.7l.automated-assurance-contract.json');
const manifest=json('audit-output/evidence-manifest.json');
for(const [name,expected] of Object.entries(manifest.files||{})){
  const p=`audit-output/${name}`;
  if(!fs.existsSync(p)) fail(`MISSING_EVIDENCE:${name}`);
  if(sha256(read(p))!==expected) fail(`HASH_MISMATCH:${name}`);
}
const conformance=json('audit-output/conformance.json');
const baseline=json('audit-output/aris97k-baseline.json');
const pbench=json('audit-output/v13-pbench.json');
const candidate=pbench.candidate;
if(!candidate || !candidate.coverage || !candidate.quality) fail('PBENCH_CANDIDATE_SCHEMA_INVALID');
const byId=xs=>new Map(xs.map(x=>[x.case_id,x]));
const b=byId(baseline.results||[]), c=byId(candidate.results||[]);
const shared=[...b.keys()].filter(id=>c.has(id));
const protectedDimensions={
  case_coverage_noninferior:candidate.coverage.cases>=baseline.coverage.cases,
  passed_cases_noninferior:candidate.quality.passed_cases>=baseline.quality.passed_cases,
  failed_cases_noninferior:candidate.quality.failed_cases<=baseline.quality.failed_cases,
  trace_reconstruction_noninferior:candidate.quality.trace_reconstruction_rate>=baseline.quality.trace_reconstruction_rate,
  unsupported_release_rate_zero:candidate.quality.unsupported_release_rate===0,
  governance_violation_rate_zero:candidate.quality.governance_violation_rate===0
};
const predicates={
  contract_bound:contract.spec_version==='9.7l'&&/^[0-9a-f]{64}$/.test(contract.spec_sha256||''),
  evidence_hashes_valid:true,
  conformance_pass:conformance.fail===0,
  baseline_execution_pass:baseline.baseline_execution_pass===true,
  candidate_execution_pass:candidate.core_execution_pass===true,
  same_corpus:baseline.comparability_manifest.TASK_CORPUS_ID===candidate.comparability_manifest.TASK_CORPUS_ID,
  same_corpus_revision:baseline.comparability_manifest.CORPUS_REVISION===candidate.comparability_manifest.CORPUS_REVISION,
  shared_cases_80:shared.length===80,
  protected_dimensions_noninferior:Object.values(protectedDimensions).every(Boolean),
  traceability:baseline.quality.trace_reconstruction_rate===1&&candidate.quality.trace_reconstruction_rate===1,
  reproduction:pbench.pbench_acceptance?.REPRODUCIBILITY_REQUIREMENT==='PASS',
  negative_testing:(conformance.checks||[]).some(x=>x.id==='C086'&&x.status==='PASS')&&(conformance.checks||[]).some(x=>x.id==='C103'&&x.status==='PASS')
};
const pass=Object.values(predicates).every(Boolean);
const result={
  assurance_contract:contract.contract_id,
  spec_version:contract.spec_version,
  spec_sha256:contract.spec_sha256,
  verifier_process:'verify-automated-assurance.js',
  evidence_generator_process:'generate-automated-assurance-evidence.js',
  manifest_hash:sha256(read('audit-output/evidence-manifest.json')),
  predicates,
  protected_dimensions:protectedDimensions,
  result:pass?'PASS':'WITHHELD',
  human_or_independent_auditor_required:false
};
fs.writeFileSync('audit-output/automated-assurance-result.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(!pass) fail('AUTOMATED_ASSURANCE_PREDICATE_FAILED');
