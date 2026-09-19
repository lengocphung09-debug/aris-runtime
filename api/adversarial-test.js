import {handoff,temporal,releaseGate,executionAttestation,claimBound,policyCompile,plan,compatible,signManifest,sha256} from '../src/runtime.js';

const baseHandoff={handoff_id:'h1',task_id:'t1',execution_id:'e1',contract_revision:'r1',sender_authority:'MASTER',receiver_authority:'CORE',object_id:'o1',revision:'v1',payload_type:'JSON',input_schema:'s1',output_schema:'s2',preconditions:[],postconditions:[],dependencies:[],evidence_references:[],provenance_references:[],expected_ack_type:'ACK_ACCEPTED',next_authorized_state:'OBSERVING',trace_id:'tr1'};

export default function handler(req,res){
  const vectors=[];
  const add=(id,expected,actual,pass,category)=>vectors.push({id,category,expected,actual,pass:Boolean(pass)});
  const malformed=handoff({handoff_id:'x'}); add('ADV-01','ACK_REJECTED_SCHEMA',malformed.ack,malformed.ack==='ACK_REJECTED_SCHEMA','handoff');
  const auth=handoff({...baseHandoff,authority_valid:false}); add('ADV-02','ACK_REJECTED_AUTHORITY',auth.ack,auth.ack==='ACK_REJECTED_AUTHORITY','authority');
  const stale=handoff({...baseHandoff,revision_status:'STALE'}); add('ADV-03','ACK_REJECTED_STATE',stale.ack,stale.ack==='ACK_REJECTED_STATE','revision');
  const dep=handoff({...baseHandoff,dependencies_satisfied:false}); add('ADV-04','ACK_REJECTED_DEPENDENCY',dep.ack,dep.ack==='ACK_REJECTED_DEPENDENCY','dependency');
  const evid=handoff({...baseHandoff,evidence_disposition_valid:false}); add('ADV-05','ACK_REJECTED_EVIDENCE',evid.ack,evid.ack==='ACK_REJECTED_EVIDENCE','evidence');
  const parallel=temporal([{event:'PARALLEL_EXECUTION_CLAIM'}]); add('ADV-06','FALSE_PARALLEL_CLAIM',parallel.violations[0],parallel.pass===false&&parallel.violations.includes('FALSE_PARALLEL_CLAIM'),'runtime-claim');
  const leap=executionAttestation(['SOURCE_VERIFIED','RUNTIME_OBSERVED']); add('ADV-07',false,leap.valid,leap.valid===false,'attestation');
  const cb=claimBound({claim_strength:5,evidence_strength:3}); add('ADV-08',false,cb.pass,cb.pass===false,'epistemic');
  const pe=policyCompile({policy_id:'p',authority:'VLF',scope:'x',predicate:'x',failure:'x',precedence:1,can_release:true}); add('ADV-09','AUTHORITY_EXPANSION_BLOCKED',pe.status,pe.status==='AUTHORITY_EXPANSION_BLOCKED','authority');
  const cyc=plan({operations:['a','b'],dependencies:[['a','b'],['b','a']]}); add('ADV-10','UNSAT',cyc.status,cyc.status==='UNSAT','planner');
  const compat=compatible({},{capability_family:'VLF',capability_id:'x',version:'1',schema_version:'1',declared_capabilities:[],authority_boundary:'text',input_schema:{},output_schema:{},semantic_guarantees:[],limitations:[],provenance:{},compatibility_profile:{schema:true,semantic:true,authority:false,failure:true,provenance:true}}); add('ADV-11',false,compat.compatible,compat.compatible===false,'semantic-compatibility');
  const gateProxy=new Proxy({}, {get:(_,k)=>k==='no_unresolved_release_blocker'?false:true}); const gate=releaseGate(gateProxy); add('ADV-12','WITHHELD',gate.state,gate.eligible===false&&gate.state==='WITHHELD','release');
  const signed=signManifest({kind:'adversarial-proof',nonce:Date.now()}); add('ADV-13',true,signed.valid,signed.valid===true,'crypto');
  const h1=sha256({a:1,b:2}),h2=sha256({a:1,b:3}); add('ADV-14','different',h1===h2?'same':'different',h1!==h2,'integrity');
  const passed=vectors.filter(v=>v.pass).length;
  res.status(passed===vectors.length?200:500).json({system:'ARIS-9.6 ULTIMATE adversarial/failure-injection',status:passed===vectors.length?'PASS_BOUNDED':'FAIL',total:vectors.length,passed,failed:vectors.length-passed,vectors,epistemic_boundary:'This bounded production adversarial suite tests encoded controls only; it does not prove universal correctness or release authority.'});
}
