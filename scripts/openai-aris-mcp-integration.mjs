import fs from 'node:fs';
import crypto from 'node:crypto';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
const MCP_URL = process.env.ARIS_MCP_URL || 'https://aris-97k-mcp-production.up.railway.app/mcp';
const OUT = process.env.ARIS_OPENAI_EVIDENCE || 'openai-aris-mcp-evidence.json';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is required');
  process.exit(2);
}

const requestBody = {
  model: MODEL,
  tools: [
    {
      type: 'mcp',
      server_label: 'aris97k',
      server_description: 'Evidence-bound ARIS-9.7k runtime. Use only declared bounded tools and preserve explicit non-claims.',
      server_url: MCP_URL,
      require_approval: 'never',
      allowed_tools: ['aris_identity', 'aris_run']
    }
  ],
  input: [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: 'Call aris_identity first, then call aris_run. Return a concise verification summary containing the canonical spec SHA-256, external-runtime evidence-bundle SHA-256, execution identifiers, and whether both tool calls completed without MCP error. Do not claim native ChatGPT registration, full ARIS-9.7k semantic equivalence, or ChatGPT-host physical parallelism.'
        }
      ]
    }
  ]
};

const startedAt = new Date().toISOString();
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

const rawText = await response.text();
let body;
try { body = JSON.parse(rawText); } catch { body = { raw_text: rawText }; }

const outputItems = Array.isArray(body?.output) ? body.output : [];
const mcpItems = outputItems.filter(x => typeof x?.type === 'string' && x.type.startsWith('mcp_'));
const calls = mcpItems.filter(x => x.type === 'mcp_call');
const approvals = mcpItems.filter(x => x.type === 'mcp_approval_request');
const errors = calls.filter(x => x.error || x.status === 'failed');

const evidence = {
  record_id: `ARIS-OPENAI-MCP-${crypto.randomUUID()}`,
  started_at_utc: startedAt,
  completed_at_utc: new Date().toISOString(),
  endpoint: 'https://api.openai.com/v1/responses',
  model: MODEL,
  mcp_server_url: MCP_URL,
  http_status: response.status,
  http_ok: response.ok,
  openai_response_id: body?.id || null,
  openai_response_status: body?.status || null,
  mcp_items_count: mcpItems.length,
  mcp_call_count: calls.length,
  mcp_calls: calls.map(x => ({
    id: x.id || null,
    name: x.name || null,
    server_label: x.server_label || null,
    status: x.status || null,
    error: x.error || null,
    output: x.output || null
  })),
  approval_request_count: approvals.length,
  mcp_error_count: errors.length,
  output_text: body?.output_text || null,
  usage: body?.usage || null,
  explicit_nonclaims: {
    native_chatgpt_app_registration: 'UNVERIFIED_NOT_CLAIMED',
    physical_chatgpt_host_parallel_execution: 'UNVERIFIED_NOT_CLAIMED',
    full_aris_9_7k_semantic_runtime_equivalence: 'UNVERIFIED_NOT_CLAIMED'
  },
  pass: Boolean(response.ok && calls.length >= 2 && errors.length === 0 && approvals.length === 0)
};

const canonical = JSON.stringify(evidence, Object.keys(evidence).sort());
evidence.record_sha256 = crypto.createHash('sha256').update(canonical).digest('hex');
fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));

if (!evidence.pass) process.exit(1);
