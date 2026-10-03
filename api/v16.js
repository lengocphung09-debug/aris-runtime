import {identity,runTrace,invariantCheck,qualification,benchmark,EVENT_TYPES} from "../src/v16/runtime.js";

function queryParam(req,name){
 const host=String(req.headers?.host||"localhost");
 const proto=String(req.headers?.["x-forwarded-proto"]||"https").split(",")[0].trim()||"https";
 const u=new URL(req.url||"/",`${proto}://${host}`);
 return u.searchParams.get(name);
}

export default async function handler(req,res){
 const action=String(queryParam(req,"action")||"identity");
 if(action==="identity")return res.status(identity().binding_complete?200:503).json(identity());
 if(action==="schema")return res.status(200).json({event_types:EVENT_TYPES,required_event_fields:["event_id","execution_id","trace_id","span_id","parent_span_id","task_id","module_id","module_version","event_type","timestamp","monotonic_ms","state_before","state_after","authority","dependencies","handoff_id","retry_count","evidence_refs","input_hash","output_hash","result"]});
 if(action==="trace"){const failure=queryParam(req,"failure");const t=await runTrace({mode:String(queryParam(req,"mode")||"serial"),failure:failure?String(failure):null});return res.status(200).json({...t,invariant_check:invariantCheck(t)});}
 if(action==="qualification")return res.status(200).json(await qualification());
 if(action==="benchmark")return res.status(200).json(await benchmark());
 return res.status(404).json({error:"UNKNOWN_ACTION",allowed:["identity","schema","trace","qualification","benchmark"]});
}
