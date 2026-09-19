import fs from 'node:fs';

const file='audit/independent-attestation.json';
const OWNER='lengocphung09-debug';
const SAME_AGENT_MARKERS=['chatgpt','openai assistant','same agent','aris implementation agent'];

function fail(reason){console.error(JSON.stringify({status:'FAIL_CLOSED',reason},null,2));process.exit(1)}
if(!fs.existsSync(file)) fail('INDEPENDENT_ATTESTATION_MISSING');
let x;try{x=JSON.parse(fs.readFileSync(file,'utf8'))}catch{fail('ATTESTATION_INVALID_JSON')}
const req=['audit_id','reviewer','reviewed_commit','reviewed_production_domain','review_timestamp','determinations','evidence','limitations','overall','statement'];
for(const k of req) if(!(k in x)) fail(`MISSING_${k.toUpperCase()}`);
if(!/^[0-9a-f]{40}$/.test(x.reviewed_commit||'')) fail('INVALID_REVIEWED_COMMIT');
if(!x.reviewer?.identity||!x.reviewer?.method||!Array.isArray(x.reviewer?.independent_from)) fail('INVALID_REVIEWER_OBJECT');
const ident=String(x.reviewer.identity).toLowerCase();
if(ident===OWNER.toLowerCase()||SAME_AGENT_MARKERS.some(m=>ident.includes(m))) fail('REVIEWER_NOT_INDEPENDENT');
const det=x.determinations||{};
const keys=['normative_oracle_coverage','vlf_semantic_compatibility','text_metrics_semantic_compatibility','production_reproduction','release_gate_5'];
for(const k of keys) if(det[k]!=='PASS') fail(`DETERMINATION_NOT_PASS:${k}:${det[k]??'MISSING'}`);
if(x.overall!=='PASS') fail(`OVERALL_NOT_PASS:${x.overall??'MISSING'}`);
if(!Array.isArray(x.evidence)||x.evidence.length<5) fail('INSUFFICIENT_EVIDENCE_REFERENCES');
if(String(x.statement||'').length<40) fail('ATTESTATION_STATEMENT_TOO_SHORT');
console.log(JSON.stringify({status:'PASS',audit_id:x.audit_id,reviewer:x.reviewer.identity,reviewed_commit:x.reviewed_commit,overall:x.overall,evidence_count:x.evidence.length},null,2));
