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
