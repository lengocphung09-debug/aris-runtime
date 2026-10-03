import crypto from "crypto";
import { performance } from "node:perf_hooks";
import manifest from "../../spec/aris-super-v1.6.runtime-manifest.json" with {type:"json"};

const uid=()=>crypto.randomUUID();
const wall=()=>new Date().toISOString();
const digest=x=>crypto.createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export const EVENT_TYPES=[
"TASK_CREATED","ROUTE_DECIDED","MODULE_ACTIVATED","EXECUTION_STARTED","HANDOFF_SENT",
"HANDOFF_ACKNOWLEDGED","EXECUTION_COMPLETED","EXECUTION_FAILED","FAILURE_RETURNED",
"OUTPUT_VERIFIED","STATE_COMMITTED","RELEASE_ADJUDICATED"
];

export function identity(){
 const implementation_hash=process.env.VERCEL_GIT_COMMIT_SHA||null;
 const deployment_url=process.env.VERCEL_URL||null;
 return {system:"ARIS-SUPER v1.6 instrumented runtime",...manifest,implementation_hash,deployment_url,
 binding_complete:Boolean(implementation_hash&&deployment_url),observed_at:wall(),
 native_host_registration:"UNVERIFIED_NOT_CLAIMED",chatgpt_scheduler_parallelism:"UNVERIFIED_NOT_CLAIMED"};
}

function makeEmitter(execution_id,trace_id,events){
 return (event_type,module_id,{parent_span_id=null,span_id=uid(),state_before=null,state_after=null,
 task_id="TASK-1",module_version="1.6",authority="ARIS_SUPER_EXECUTION",dependencies=[],
 handoff_id=null,retry_count=0,evidence_refs=[],input=null,output=null,result=null,extra={}}={})=>{
   const e={event_id:uid(),execution_id,trace_id,span_id,parent_span_id,task_id,module_id,module_version,
   event_type,timestamp:wall(),monotonic_ms:performance.now(),state_before,state_after,authority,dependencies,
   handoff_id,retry_count,evidence_refs,input_hash:input===null?null:digest(input),
   output_hash:output===null?null:digest(output),result,...extra};
   events.push(e); return e;
 };
}

async function moduleWork({module_id,parent_span_id,emit,duration_ms,failure=null,input}){
 const span_id=uid();
 emit("MODULE_ACTIVATED",module_id,{parent_span_id,span_id,state_before:"ROUTED",state_after:"ACTIVE",input});
 const start=performance.now();
 emit("EXECUTION_STARTED",module_id,{parent_span_id,span_id,state_before:"ACTIVE",state_after:"RUNNING",input,extra:{monotonic_start_ms:start}});
 await sleep(duration_ms);
 if(failure===module_id){
   const end=performance.now(),failure_id="FI-"+module_id+"-"+uid();
   emit("EXECUTION_FAILED",module_id,{parent_span_id,span_id,state_before:"RUNNING",state_after:"FAILED",input,result:"FAILURE_INJECTED",extra:{failure_id,monotonic_end_ms:end,duration_ms:end-start}});
   emit("FAILURE_RETURNED",module_id,{parent_span_id,span_id,state_before:"FAILED",state_after:"RETURNED",result:"RETURN_TO_KERNEL",extra:{failure_id,failure_destination:"KERNEL"}});
   return {module_id,span_id,start_ms:start,end_ms:end,failed:true};
 }
 const end=performance.now(),output={module_id,ok:true};
 emit("EXECUTION_COMPLETED",module_id,{parent_span_id,span_id,state_before:"RUNNING",state_after:"COMPLETED",input,output,result:"PASS",extra:{monotonic_end_ms:end,duration_ms:end-start}});
 return {module_id,span_id,start_ms:start,end_ms:end,failed:false};
}

export async function runTrace({mode="serial",failure=null,duration_ms=35}={}){
 const execution_id=uid(),trace_id=uid(),events=[];
 const emit=makeEmitter(execution_id,trace_id,events);
 const root=emit("TASK_CREATED","KERNEL",{state_after:"CREATED",authority:"KERNEL"});
 emit("ROUTE_DECIDED","KERNEL",{parent_span_id:root.span_id,state_before:"CREATED",state_after:"ROUTED",authority:"KERNEL",dependencies:["M01","M02"]});
 const handoff_id=uid();
 emit("HANDOFF_SENT","KERNEL",{parent_span_id:root.span_id,state_before:"ROUTED",state_after:"HANDOFF_PENDING",authority:"KERNEL",handoff_id,dependencies:["M01","M02"]});
 emit("HANDOFF_ACKNOWLEDGED","COORDINATOR",{parent_span_id:root.span_id,state_before:"HANDOFF_PENDING",state_after:"ACKNOWLEDGED",authority:"COORDINATOR",handoff_id,result:"RECEIPT_ONLY"});
 let spans;
 if(mode==="concurrent"){
   spans=await Promise.all([
     moduleWork({module_id:"M01",parent_span_id:root.span_id,emit,duration_ms,failure,input:{workload:"A"}}),
     moduleWork({module_id:"M02",parent_span_id:root.span_id,emit,duration_ms,failure,input:{workload:"B"}})
   ]);
 }else{
   spans=[];
   spans.push(await moduleWork({module_id:"M01",parent_span_id:root.span_id,emit,duration_ms,failure,input:{workload:"A"}}));
   spans.push(await moduleWork({module_id:"M02",parent_span_id:root.span_id,emit,duration_ms,failure,input:{workload:"B"}}));
 }
 const [a,b]=spans;
 const overlap=Math.max(0,Math.min(a.end_ms,b.end_ms)-Math.max(a.start_ms,b.start_ms));
 if(!spans.some(s=>s.failed)){
   emit("OUTPUT_VERIFIED","VERIFIER",{parent_span_id:root.span_id,state_before:"COMPLETED",state_after:"VERIFIED",authority:"VERIFIER",result:"PASS"});
   emit("STATE_COMMITTED","KERNEL",{parent_span_id:root.span_id,state_before:"VERIFIED",state_after:"COMMITTED",authority:"KERNEL",result:"COMMIT"});
 }
 const violations=[];
 if(events.some(e=>e.event_type==="STATE_COMMITTED")&&spans.some(s=>s.failed))violations.push("COMMIT_AFTER_FAILURE");
 const handoffs=events.filter(e=>e.handoff_id===handoff_id);
 if(!handoffs.some(e=>e.event_type==="HANDOFF_SENT")||!handoffs.some(e=>e.event_type==="HANDOFF_ACKNOWLEDGED"))violations.push("HANDOFF_ACK_GAP");
 return {system:"ARIS-SUPER v1.6 trace",execution_id,trace_id,mode,events,spans,
 observed_async_overlap_ms:overlap,async_concurrency_observed:mode==="concurrent"&&overlap>0,
 worker_level_parallelism_observed:false,chatgpt_scheduler_parallelism:"UNVERIFIED_NOT_CLAIMED",
 violations,trace_hash:digest(events),release_status:"WITHHELD"};
}

export function invariantCheck(t){
 const violations=[...(t.violations||[])],ids=new Set();
 for(const e of t.events){if(ids.has(e.event_id))violations.push("DUPLICATE_EVENT_ID");ids.add(e.event_id);}
 return {pass:violations.length===0,violations,event_count:t.events.length,trace_hash:t.trace_hash};
}

async function sample(mode,n=8){
 const durations=[];
 for(let i=0;i<n;i++){const s=performance.now();await runTrace({mode,duration_ms:25});durations.push(performance.now()-s);}
 return durations;
}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const median=a=>{const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;};

export async function qualification(){
 const serial=await runTrace({mode:"serial"}),concurrent=await runTrace({mode:"concurrent"}),failure=await runTrace({mode:"serial",failure:"M02"});
 const checks={
  identity_spec_bound:identity().spec_sha256===manifest.spec_sha256,
  serial_no_overlap:serial.observed_async_overlap_ms===0,
  concurrent_overlap_observed:concurrent.observed_async_overlap_ms>0,
  concurrent_invariants:invariantCheck(concurrent).pass,
  handoff_ack_observed:concurrent.events.some(e=>e.event_type==="HANDOFF_SENT")&&concurrent.events.some(e=>e.event_type==="HANDOFF_ACKNOWLEDGED"),
  failure_return_observed:failure.events.some(e=>e.event_type==="FAILURE_RETURNED"),
  failure_no_commit:!failure.events.some(e=>e.event_type==="STATE_COMMITTED"),
  failure_invariants:invariantCheck(failure).pass
 };
 return {system:"ARIS-SUPER v1.6 instrumented-runtime qualification",checks,pass:Object.values(checks).every(Boolean),
 serial:{overlap_ms:serial.observed_async_overlap_ms,trace_hash:serial.trace_hash},
 concurrent:{overlap_ms:concurrent.observed_async_overlap_ms,trace_hash:concurrent.trace_hash},
 failure:{trace_hash:failure.trace_hash},
 claim_boundary:"Async overlap is observed inside this Node runtime only. Worker-level physical parallelism and ChatGPT native scheduler parallelism are not claimed.",
 release_status:"WITHHELD"};
}

export async function benchmark(){
 const serial=await sample("serial"),concurrent=await sample("concurrent");
 const sm=mean(serial),cm=mean(concurrent),delta=sm-cm,pct=delta/sm*100;
 return {system:"ARIS-SUPER v1.6 paired runtime microbenchmark",sample_size_per_arm:serial.length,
 serial_ms:{mean:sm,median:median(serial),samples:serial},
 concurrent_ms:{mean:cm,median:median(concurrent),samples:concurrent},
 delta_ms:delta,relative_delta_percent:pct,
 quality_non_regression:"STRUCTURAL_INVARIANT_CHECK_ONLY",
 claim_boundary:"This measures only the instrumented two-module synthetic runtime workload. It is not evidence of end-to-end research-task speed, cost reduction, native scheduler parallelism, or universal performance gain."};
}
