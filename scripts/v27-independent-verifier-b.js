import {createHash} from "node:crypto";
const words=s=>new Set(String(s).toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean));
export function verifierBClaim(x){
 if(x.sourceValid!==true||x.stale===true||x.contradicted===true)return {supported:false,reason:"SOURCE_GATE"};
 if(!["PRIMARY","SECONDARY","DIRECT_RUNTIME"].includes(x.sourceRole))return {supported:false,reason:"ROLE_GATE"};
 const a=words(x.claimText),b=words(x.evidenceText);let common=0;for(const t of a)if(b.has(t))common++;
 return {supported:common>=Math.ceil(Math.max(1,a.size)*0.6),reason:"LEXICAL_ENTAILMENT_B"};
}
export function verifierBFingerprint(){return createHash("sha256").update(verifierBClaim.toString()).digest("hex")}
