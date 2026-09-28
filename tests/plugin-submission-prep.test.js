import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMcpMessage } from '../api/mcp.js';

const EXPECTED_TOOLS = ['aris_identity','aris_conformance','aris_benchmark','aris_run'];

test('public MCP tools expose required review annotations', () => {
  const response = handleMcpMessage({jsonrpc:'2.0',id:1,method:'tools/list'});
  assert.equal(response.status, 200);
  const tools = response.body.result.tools;
  assert.deepEqual(tools.map(t => t.name), EXPECTED_TOOLS);
  for (const tool of tools) {
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} readOnlyHint`);
    assert.equal(tool.annotations?.openWorldHint, false, `${tool.name} openWorldHint`);
    assert.equal(tool.annotations?.destructiveHint, false, `${tool.name} destructiveHint`);
    assert.equal(tool.annotations?.idempotentHint, true, `${tool.name} idempotentHint`);
    assert.equal(tool.inputSchema?.type, 'object');
    assert.equal(tool.inputSchema?.additionalProperties, false);
    assert.ok(tool.title && tool.description);
  }
});

test('identity output is minimal and preserves evidence boundaries', () => {
  const response = handleMcpMessage({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'aris_identity',arguments:{}}});
  assert.equal(response.status, 200);
  const value = response.body.result.structuredContent;
  assert.equal(value.canonical_spec_sha256, '06b0f0c6dc2e814e5f43053e694bab3f4096d4349ef3ba7369d093e51a869a76');
  assert.equal(value.external_runtime_evidence_bundle_sha256, 'f180b39e73be8cd807ea788976232ffa2e00b5eeaefb3788cefc42cdb1eb7920');
  assert.equal(value.registration_scope, 'REMOTE_MCP_PLUGIN_CAPABILITY');
  assert.equal(value.explicit_nonclaims.built_in_native_chatgpt_skill_registration, 'UNVERIFIED_NOT_CLAIMED');
  assert.equal('execution_id' in value, false);
  assert.equal('observed_at' in value, false);
  assert.equal('deployment_url' in value, false);
});
