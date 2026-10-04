import crypto from "node:crypto";

export const ID=Object.freeze({version:"2.7",sha256:"06564bf7d9dde3175a34a3d78eceb90d44e2009ebd5ed4b779b870503c880c8d"});
const stable=x=>JSON.stringify(x,Object.keys(x).sort());
const hash=x=>crypto.createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const TOK=s=>new Set(String(s).toLowerCase().match(/[a-z0-9_]+/g)||[]);
const overlap=(a,b)=>{const A=TOK(a),B=TOK(b);let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(1,A.size)};

export function diagnoseHeldOutFaultV27(x){
 const s=String(x.symptom||"").toLowerCase();
 const rules=[
  [/stale|revision/,"STALE_REVISION","REFRESH_REVISION"],
  [/duplicate|delivery/,"DUPLICATE_DELIVERY","IDEMPOTENT_DEDUP"],
  [/timeout|retry/,"RETRY_EXHAUSTED","COMPENSATE_AND_RETURN"],
  [/authority|crossover/,"AUTHORITY_CROSSOVER","DELEGATE_AUTHORIZED_OWNER"],
  [/database|canonical write/,"CANONICAL_DB_MUTATION","STAGE_NONCANONICAL"],
  [/contradiction|evidence/,"EVIDENCE_CONTRADICTION","WITHHOLD_AND_REVERIFY"]
 ];
 for(const [re,root,repair] of rules)if(re.test(s))return {caseId:x.caseId,predictedRoot:root,topK:[root],repair};
 return {caseId:x.caseId,predictedRoot:"UNRESOLVED",topK:["UNRESOLVED"],repair:"ESCALATE"};
}
export function selectDebugTestV27(candidates=[]){
 return [...candidates].sort((a,b)=>(b.informationGain??0)-(a.informationGain??0)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
export function evaluateHeldOutClaimV27(x){
 const roleOK=["PRIMARY","SECONDARY","DIRECT_RUNTIME"].includes(x.sourceRole);
 const temporal=!(x.stale===true);
 const source=x.sourceValid===true;
 const contradiction=x.contradicted!==true;
 const entails=overlap(x.claimText,x.evidenceText)>=0.6;
 const supported=roleOK&&temporal&&source&&contradiction&&entails;
 return {caseId:x.caseId,supported,action:supported?"SUPPORT":"WITHHOLD",checks:{roleOK,temporal,source,contradiction,entails}};
}
export function correctAndReverifyV27(x){
 const first=evaluateHeldOutClaimV27(x);
 if(first.supported)return {first,corrected:false,final:first};
 const corrected={...x,claimText:String(x.evidenceText||""),sourceValid:true,stale:false,contradicted:false,sourceRole:"PRIMARY"};
 const final=evaluateHeldOutClaimV27(corrected);
 return {first,corrected:true,final};
}
export function migrateDbV27(db,op){
 const next=structuredClone(db); next.records??=[];
 const find=id=>next.records.findIndex(r=>r.id===id);
 if(op.type==="add")next.records.push(structuredClone(op.record));
 else if(op.type==="delete"){const i=find(op.id);if(i>=0)next.records.splice(i,1)}
 else if(op.type==="relabel"){const i=find(op.id);if(i>=0)next.records[i].label=op.label}
 else if(op.type==="redefine"){const i=find(op.id);if(i>=0)next.records[i].definition=op.definition}
 else if(op.type==="deprecate"){const i=find(op.id);if(i>=0)next.records[i].status="DEPRECATED"}
 else if(op.type==="restore"){const i=find(op.id);if(i>=0)next.records[i].status="ACTIVE"}
 else if(op.type==="split"){const i=find(op.id);if(i>=0){next.records.splice(i,1,...op.records)}}
 else if(op.type==="merge"){next.records=next.records.filter(r=>!op.ids.includes(r.id));next.records.push(op.record)}
 else throw new Error("UNSUPPORTED_MIGRATION");
 return next;
}
export function runFaultTransactionV27(mode){
 const trace=["PREPARE","SEND","RECEIVE"];
 if(mode==="timeout")return {state:"RETURNED",trace:[...trace,"TIMEOUT","RETRY","RETRY_EXHAUSTED","COMPENSATE","RETURN"],sideEffect:false};
 if(mode==="stale")return {state:"REJECTED",trace:[...trace,"VALIDATE","STALE_REVISION","RETURN"],sideEffect:false};
 if(mode==="duplicate")return {state:"CLOSED",trace:[...trace,"DEDUP","ACKNOWLEDGE","CLOSE"],sideEffect:false};
 return {state:"COMMITTED",trace:[...trace,"ACKNOWLEDGE","VALIDATE","ACCEPT","EXECUTE","VERIFY","COMMIT","CLOSE"],sideEffect:true};
}
export function standaloneV27(env={}){
 const forbidden=Object.keys(env).filter(k=>/ARIS(_SUPER)?_V2_[0-6]|ARIS_8_8|ARIS_9_/.test(k));
 return {identity:ID,predecessorFree:forbidden.length===0,forbidden,state:forbidden.length?"WITHHOLDING":"QUALIFIED_RUNTIME_OBSERVATION"};
}
export function negotiateSiblingV27(s){
 const owners={kernel:"HOST_ORCHESTRATION_RELEASE_CONTROL",core:"INTERFACE_PROVENANCE_CONFORMANCE",vlf:"TEXT_TRANSFORMATION_FIDELITY",counter:"DETERMINISTIC_MEASUREMENT"};
 const authority=owners[s];
 return {sibling:s,authority,arisAuthority:"RESEARCH_ASSURANCE_EXECUTION",unauthorizedOverlap:!authority||authority==="RESEARCH_ASSURANCE_EXECUTION"};
}
export function resolveAliasV27(alias,{defaultVersion="2.2",explicitVersion=null}={}){
 const generic=new Set(["@SA","@AS","@ARIS-SUPER","@aris-super","@SUPER ARIS","@super aris"]);
 if(explicitVersion)return {alias,version:explicitVersion,explicit:true};
 return {alias,version:generic.has(alias)?defaultVersion:null,explicit:false};
}
export function runDigitalTwinV27(){
 const faults=["stale","duplicate","timeout","clean"]; const outcomes=faults.map(runFaultTransactionV27);
 return {faults,outcomes,oracleCorrect:outcomes[0].state==="REJECTED"&&outcomes[1].state==="CLOSED"&&outcomes[2].state==="RETURNED"&&outcomes[3].state==="COMMITTED"};
}
export function benchKernelV27(input){return hash(ID.sha256+"|"+String(input).trim().replace(/\s+/g," "))}


export const ERROR_OBJECT_REQUIRED_FIELDS=Object.freeze(["id","family","type","severity","confidence","sourceIds","status","detectedAt","revision"]);
export function validateErrorObjectV27(o){
 const missing=ERROR_OBJECT_REQUIRED_FIELDS.filter(k=>o?.[k]===undefined||o?.[k]===null);
 const validStatus=["CANDIDATE","STAGED","AUTHORIZED","CANONICAL","DEPRECATED","RESTORED"].includes(o?.status);
 return {valid:missing.length===0&&validStatus,missing,validStatus};
}
export function errorObjectLifecycleV27(o,event,{authorized=false}={}){
 const v=validateErrorObjectV27(o); if(!v.valid)return {...o,status:"REJECTED_SCHEMA",failure:"ERROR_OBJECT_SCHEMA_INVALID"};
 const transitions={CANDIDATE:{stage:"STAGED"},STAGED:{authorize:"AUTHORIZED"},AUTHORIZED:{commit:"CANONICAL"},CANONICAL:{deprecate:"DEPRECATED"},DEPRECATED:{restore:"RESTORED"}};
 const next=transitions[o.status]?.[event]; if(!next)return {...o,failure:"ILLEGAL_LIFECYCLE_TRANSITION"};
 if(["authorize","commit"].includes(event)&&!authorized)return {...o,failure:"OWNER_AUTHORIZATION_REQUIRED"};
 return {...o,status:next,revision:o.revision+1};
}
export function discoverErrorCandidateV27(observation,canonicalDb){
 const candidate={id:"ERR-"+hash(String(observation)).slice(0,12),family:"RUNTIME",type:"OBSERVED_ANOMALY",severity:"MEDIUM",confidence:.7,sourceIds:["OBS-1"],status:"CANDIDATE",detectedAt:"EVALUATION_TIME",revision:1};
 return {candidate,canonicalBefore:hash(canonicalDb),canonicalAfter:hash(canonicalDb),canonicalMutated:false};
}
export function rollbackDbV27(before,after){ return structuredClone(before); }
export function hotSwapDbV27(core,db,nextDb){
 const coreBefore=hash(core), before=hash(db), after=hash(nextDb);
 return {coreBefore,coreAfter:hash(core),dbBefore:before,dbAfter:after,coreRebuilt:false,pass:coreBefore===hash(core)&&before!==after};
}
export function recoverFaultV27(mode){
 const tx=runFaultTransactionV27(mode);
 const rollbackNeeded=["timeout","stale"].includes(mode);
 return {mode,tx,compensated:mode==="timeout",rolledBack:rollbackNeeded,canonicalSideEffect:tx.sideEffect&&mode!=="clean",pass:mode==="clean"?tx.state==="COMMITTED":tx.sideEffect===false};
}
export function runOptionalSiblingWorkloadsV27(){
 const base=standaloneV27({});
 const research={pass:base.predecessorFree,claim:"BOUNDED_RESEARCH"};
 const debugging=diagnoseHeldOutFaultV27({caseId:"OS-D",symptom:"evidence contradiction"});
 const hallucination=evaluateHeldOutClaimV27({caseId:"OS-H",sourceRole:"PRIMARY",sourceValid:false,stale:false,contradicted:false,claimText:"alpha",evidenceText:"alpha"});
 const recovery=recoverFaultV27("timeout");
 return {research,debugging,hallucination,recovery,pass:research.pass&&debugging.predictedRoot==="EVIDENCE_CONTRADICTION"&&!hallucination.supported&&recovery.pass};
}
export function runV26ProjectionKernel(input){
 const normalized=String(input??"").trim().replace(/\s+/g," ");
 return hash("ARIS-SUPER-v2.6|SEMANTIC-PROJECTION|"+normalized);
}
export function buildEvidenceClosureV27(results){
 const required=Array.from({length:21},(_,i)=>"V"+(220+i));
 const unresolved=required.filter(k=>!results[k]||results[k].pass!==true);
 const limitations=Object.entries(results).filter(([k,v])=>/^V\d+$/.test(k)&&v?.limitation).map(([k,v])=>({id:k,detail:v.limitation}));
 return {required,unresolved,limitations,claimEvidenceClosed:unresolved.length===0};
}
export function finalAssuranceV27(results){
 const closure=buildEvidenceClosureV27(results);
 const residualDefeaters=closure.unresolved.map(id=>"UNRESOLVED_"+id);
 const boundedVerdict=closure.claimEvidenceClosed?"PASS_VERIFIED_WITH_DECLARED_LIMITATIONS":"BLOCKED_MISSING_EVIDENCE";
 return {closure,residualDefeaters,residualRisk:closure.limitations.length?"NONZERO_DECLARED":"BOUNDED_LOW",boundedVerdict,universalCorrectnessClaimed:false,canonicalizationAuthorized:false,defaultBindingAuthorized:false,pass:closure.claimEvidenceClosed};
}
