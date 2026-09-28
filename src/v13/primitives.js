import crypto from "crypto";
export const sha256=x=>crypto.createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
export const outcome=(id,status,evidence,reason)=>({test_id:id,status,evidence,reason});
export function authorityMatrix(){return {KERNEL:["authorize","adjudicate","release"],CORE:["resolve_capability"],MASTER:["research_execute"],RPEC:["specify"],VLF:["text_transform"],TEXT_METRICS:["measure"],RED_TEAM:["challenge"],VALIDATION:["validate"],RAA:["audit"]};}
export function can(role,action){return (authorityMatrix()[role]||[]).includes(action);}
export function handoff(x){const required=["sender","receiver","object_id","revision","expected_ack"];const valid=required.every(k=>x[k]);if(!valid)return{accepted:false,ack:"ACK_REJECTED_SCHEMA",return_path:"sender"};if(x.stale)return{accepted:false,ack:"ACK_REJECTED_STATE",return_path:"sender"};return{accepted:true,ack:"ACK_ACCEPTED",commit:true};}
export function dag(ops,edges){const indeg=Object.fromEntries(ops.map(x=>[x,0]));for(const[a,b]of edges){if(!(a in indeg)||!(b in indeg))return{valid:false,reason:"UNKNOWN_NODE"};indeg[b]++;}const q=ops.filter(x=>!indeg[x]),order=[];while(q.length){const n=q.shift();order.push(n);for(const[a,b]of edges)if(a===n&&--indeg[b]===0)q.push(b);}return{valid:order.length===ops.length,order,cycle:order.length!==ops.length};}
export function stateCommit(current,expected,write){if(current.revision!==expected)return{committed:false,conflict:true};return{committed:true,state:{...current,...write,revision:current.revision+1}};}
export function compact(s){const keep=["snapshot_id","parent_snapshot","revision","hash","materiality_summary","active_dependencies","open_failures","release_impact","trace_id"];return Object.fromEntries(keep.filter(k=>k in s).map(k=>[k,s[k]]));}
export function citationIntegrity(x){return Boolean(x.source_identity_correct&&x.claim_source_relation_acceptable);}
export function claimBound(evidence,claim){return evidence>=claim;}
export function releaseGate(g){const required=["task_contract_valid","policy_valid","authority_valid","dependencies_closed","handoffs_acknowledged","evidence_sufficient","provenance_sufficient","verification_pass","validation_pass","red_team_complete","audit_pass","no_unresolved_release_blocker"];return{eligible:required.every(k=>g[k]===true)};}
export function adapter(profile){const keys=["schema","semantic","authority","unit","normalization","state","failure","provenance","regression"];const missing=keys.filter(k=>profile[k]!==true);return{qualified:missing.length===0,missing};}
export function retry(op,max=2){let n=0;while(n<=max){const r=op(n);if(r.ok)return{status:"SUCCESS",attempts:n+1};n++;}return{status:"WITHHELD",attempts:n};}
export function assuranceIndependent(a,b){return a.method!==b.method||a.evidence!==b.evidence||a.owner!==b.owner;}
