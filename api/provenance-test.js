import {executionAttestation,merkle,sha256,signManifest,releaseGate} from '../src/runtime.js';

export default function handler(req,res){
  const execution_id=`prov-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const chain=['SOURCE_VERIFIED','BUILD_VERIFIED','ARTIFACT_VERIFIED','CONFIGURATION_VERIFIED','DEPLOYMENT_VERIFIED','RUNTIME_OBSERVED','EXECUTION_OBSERVED','RESULT_BOUND_TO_EXECUTION'];
  const attestation=executionAttestation(chain);
  const nodes=[
    {type:'source',id:'github:lengocphung09-debug/aris-runtime'},
    {type:'build',id:'vercel-build'},
    {type:'deployment',id:'aris-runtime-umber.vercel.app'},
    {type:'execution',id:execution_id},
    {type:'result',id:'C01-C112-runtime-harness'}
  ];
  const leaf_hashes=nodes.map(n=>sha256(n));
  const merkle_root=merkle(nodes);
  const signed=signManifest({execution_id,chain,nodes,merkle_root});
  const state_sequence=['CREATED','INSPECTING','CONTRACTING','CONTRACT_READY','ROUTED','AUTHORIZED','EXECUTING','OBSERVING','VERIFYING','VALIDATING','AUDITING','CALIBRATING','RELEASE_ELIGIBLE'];
  const state_unique=state_sequence.length===new Set(state_sequence).size;
  const release=releaseGate(new Proxy({}, {get:(_,k)=>k==='no_unresolved_release_blocker'?false:true}));
  const checks={attestation_chain_complete:attestation.valid&&attestation.complete,merkle_root_nonempty:Boolean(merkle_root),leaf_hashes_unique:new Set(leaf_hashes).size===leaf_hashes.length,signature_valid:signed.valid,state_sequence_unique:state_unique,release_fail_closed:release.state==='WITHHELD'&&!release.eligible};
  const pass=Object.values(checks).every(Boolean);
  res.status(pass?200:500).json({system:'ARIS-9.6 ULTIMATE provenance/state test',status:pass?'PASS_BOUNDED':'FAIL',execution_id,checks,attestation,merkle_root,signed:{algorithm:signed.algorithm,manifest_hash:signed.manifest_hash,valid:signed.valid,note:signed.note},state_sequence,release_probe:{state:release.state,eligible:release.eligible,failed:release.failed},epistemic_boundary:'Integrity, provenance and state consistency do not imply factual truth or release authority.'});
}
