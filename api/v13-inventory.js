import crypto from "crypto";
import { readFileSync } from "fs";
const inventory=JSON.parse(readFileSync(new URL("../spec/aris-super-v1.3.inventory.json",import.meta.url),"utf8"));
const binding=JSON.parse(readFileSync(new URL("../spec/aris-super-v1.3.source-binding.json",import.meta.url),"utf8"));
export default function handler(req,res){
 const counts=Object.fromEntries(Object.entries(inventory.groups).map(([k,v])=>[k,v.length]));
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 const unique=new Set(Object.values(inventory.groups).flat());
 const checks={
  source_hash_bound:inventory.source_sha256===binding.source_sha256,
  group_counts_match:Object.entries(inventory.expected_counts).every(([k,v])=>counts[k]===v),
  total_152:total===inventory.expected_total&&total===152,
  all_ids_unique:unique.size===total
 };
 const pass=Object.values(checks).every(Boolean);
 res.status(pass?200:409).json({system:"ARIS-SUPER v1.3 protected inventory gate",execution_id:crypto.randomUUID(),observed_at:new Date().toISOString(),checks,counts,total,unique_ids:unique.size,protected_inventory_pass:pass,next_gate:"C01-C50 executable conformance",release_status:"WITHHELD",epistemic_boundary:"Inventory presence/count/uniqueness does not establish field-level semantic preservation, C01-C50 conformance, empirical performance, independent audit, or release."});
}