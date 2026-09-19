import test from 'node:test';import assert from 'node:assert/strict';import {handoff,temporal,releaseGate,executionAttestation,claimBound,policyCompile} from '../src/runtime.js';
test('reject fabricated parallel claim without observation',()=>assert.equal(temporal([{event:'PARALLEL_EXECUTION_CLAIM'}]).pass,false));
test('reject handoff with missing schema',()=>assert.equal(handoff({handoff_id:'x'}).ack,'ACK_REJECTED_SCHEMA'));
test('reject authority expansion',()=>assert.equal(policyCompile({policy_id:'x',authority:'VLF',scope:'x',predicate:'x',failure:'x',precedence:1,can_release:true}).status,'AUTHORITY_EXPANSION_BLOCKED'));
test('reject source->runtime leap',()=>assert.equal(executionAttestation(['SOURCE_VERIFIED','RUNTIME_OBSERVED']).valid,false));
test('reject conclusion stronger than evidence',()=>assert.equal(claimBound({claim_strength:5,evidence_strength:3}).pass,false));
test('release withheld with one blocker',()=>{const g=new Proxy({}, {get:(_,k)=>k==='no_unresolved_release_blocker'?false:true});const r=releaseGate(g);assert.equal(r.eligible,false);});
