import test from "node:test";import assert from "node:assert/strict";import {identity,runTrace,invariantCheck,qualification} from "../src/v97k/runtime.js";
test("9.7k manifest binding",()=>{const x=identity();assert.equal(x.spec_version,"9.7k");assert.equal(x.spec_sha256,"7cca6b5b0414475d8af8f246e09e0aeea6a26ec6d9f787c443ebc3e476aec646");assert.equal(x.source_size_bytes,632763);assert.equal(x.self_authorizing,false)});
test("serial trace has no overlap",()=>assert.equal(runTrace({mode:"serial"}).observed_overlap_ms,0));
test("parallel model has observed overlap",()=>{const x=runTrace({mode:"parallel"});assert.ok(x.observed_overlap_ms>0);assert.equal(invariantCheck(x).pass,true)});
test("failure injection fails closed",()=>{const x=runTrace({mode:"serial",failure:"M02"});assert.equal(x.events.some(e=>e.event_type==="STATE_COMMITTED"),false);assert.equal(invariantCheck(x).pass,true)});
test("qualification passes bounded runtime checks",()=>assert.equal(qualification().pass,true));
