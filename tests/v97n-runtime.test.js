import test from "node:test";import assert from "node:assert/strict";import {identity,runTrace,invariantCheck,qualification} from "../src/v97n/runtime.js";
test("spec identity frozen",()=>assert.equal(identity().spec_sha256,"6a94851ef062e872d128c2ccf3aa05d6e9a0a0f4c0653a626f8f9e9b6de7c101"));
test("serial no overlap",()=>assert.equal(runTrace({mode:"serial"}).observed_overlap_ms,0));
test("parallel overlap observed",()=>assert.ok(runTrace({mode:"parallel"}).observed_overlap_ms>0));
test("failure returns without commit",()=>{const x=runTrace({failure:"M02"});assert.equal(x.events.some(e=>e.event_type==="STATE_COMMITTED"),false);assert.equal(invariantCheck(x).pass,true)});
test("qualification passes",()=>assert.equal(qualification().pass,true));
