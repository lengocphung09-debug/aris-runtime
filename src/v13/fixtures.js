export const blocked=new Set(["C38","C45","C46"]);
export const evidenceSchema=["test_id","fixture_id","spec_sha256","contract_sha256","execution_id","observed_behavior","expected_behavior","result","evidence_refs"];
export function fixture(id){return {test_id:id,positive:{fixture_id:id+"-P",kind:"conforming"},negative:{fixture_id:id+"-N",kind:"adversarial"},expected:"canonical requirement preserved; material violation fails closed"};}
export const fixtures=Object.fromEntries(Array.from({length:50},(_,i)=>{const id="C"+String(i+1).padStart(2,"0");return[id,fixture(id)];}));
