import test from "node:test";import assert from "node:assert/strict";import {identity,runTrace,invariantCheck,qualification,benchmark} from "../src/v16/runtime.js";
test("spec identity frozen",()=>assert.equal(identity().spec_sha256,"1b6d21e23391fd34441534c575068f5504e5a5dce3268a160a9900f91fa4a8c0"));
test("serial has no overlap",async()=>assert.equal((await runTrace({mode:"serial"})).observed_async_overlap_ms,0));
test("real async concurrent trace overlaps",async()=>{const x=await runTrace({mode:"concurrent"});assert.ok(x.observed_async_overlap_ms>0);assert.equal(x.async_concurrency_observed,true);assert.equal(x.worker_level_parallelism_observed,false);});
test("handoff is sent and acknowledged",async()=>{const x=await runTrace({mode:"concurrent"});assert.ok(x.events.some(e=>e.event_type==="HANDOFF_SENT"));assert.ok(x.events.some(e=>e.event_type==="HANDOFF_ACKNOWLEDGED"));});
test("failure returns to kernel and prevents commit",async()=>{const x=await runTrace({failure:"M02"});assert.ok(x.events.some(e=>e.event_type==="FAILURE_RETURNED"));assert.equal(x.events.some(e=>e.event_type==="STATE_COMMITTED"),false);assert.equal(invariantCheck(x).pass,true);});
test("qualification passes",async()=>assert.equal((await qualification()).pass,true));
test("paired benchmark emits bounded measurements",async()=>{const x=await benchmark();assert.equal(x.sample_size_per_arm,8);assert.ok(Number.isFinite(x.relative_delta_percent));});
