import test from "node:test";
import assert from "node:assert/strict";
import { handleMcpMessage } from "../api/mcp.js";

const rpc=(id,method,params)=>handleMcpMessage({jsonrpc:"2.0",id,method,...(params?{params}:{})});

test("initialize advertises MCP server",()=>{
  const r=rpc(1,"initialize",{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"test",version:"1"}});
  assert.equal(r.status,200);
  assert.equal(r.body.result.serverInfo.name,"aris-9.7k-chatgpt-plugin");
  assert.equal(r.body.result.protocolVersion,"2025-06-18");
});

test("tools/list exposes exactly four bounded ARIS tools",()=>{
  const r=rpc(2,"tools/list");
  const names=r.body.result.tools.map(x=>x.name);
  assert.deepEqual(names,["aris_identity","aris_conformance","aris_benchmark","aris_run"]);
});

test("identity binds canonical spec and keeps native-host claims unverified",()=>{
  const r=rpc(3,"tools/call",{name:"aris_identity",arguments:{}});
  const x=r.body.result.structuredContent;
  assert.equal(x.canonical_spec_sha256,"06b0f0c6dc2e814e5f43053e694bab3f4096d4349ef3ba7369d093e51a869a76");
  assert.equal(x.external_runtime_evidence_bundle_sha256,"f180b39e73be8cd807ea788976232ffa2e00b5eeaefb3788cefc42cdb1eb7920");
  assert.equal(x.registration_scope,"REMOTE_MCP_PLUGIN_CAPABILITY");
  assert.equal(x.explicit_nonclaims.built_in_native_chatgpt_skill_registration,"UNVERIFIED_NOT_CLAIMED");
});

test("aris_run executes frozen 80-case bounded baseline",()=>{
  const r=rpc(4,"tools/call",{name:"aris_run",arguments:{}});
  const x=r.body.result.structuredContent;
  assert.equal(x.coverage.cases,80);
  assert.equal(x.baseline_execution_pass,true);
});

test("aris_benchmark executes candidate corpus",()=>{
  const r=rpc(5,"tools/call",{name:"aris_benchmark",arguments:{}});
  const x=r.body.result.structuredContent;
  assert.equal(x.candidate.coverage.cases,80);
  assert.equal(x.candidate.core_execution_pass,true);
  assert.equal(x.comparability.shared_cases,80);
});

test("unknown MCP tool fails closed",()=>{
  const r=rpc(6,"tools/call",{name:"not_a_tool",arguments:{}});
  assert.equal(r.body.result.isError,true);
});
