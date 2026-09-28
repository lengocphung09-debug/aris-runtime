import crypto from "crypto";
import { runV13 } from "../src/v13/harness.js";
import { runPBench } from "../src/v13/pbench.js";
import { run97kBaseline } from "../src/baseline97k/runner.js";

const SERVER_INFO = { name: "aris-9.7k-chatgpt-plugin", version: "0.1.0" };
const PROTOCOL_VERSION = "2025-06-18";
const CANONICAL_SPEC_SHA256 = "06b0f0c6dc2e814e5f43053e694bab3f4096d4349ef3ba7369d093e51a869a76";
const EXTERNAL_RUNTIME_BUNDLE_SHA256 = "f180b39e73be8cd807ea788976232ffa2e00b5eeaefb3788cefc42cdb1eb7920";

const tools = [
  {
    name: "aris_identity",
    title: "ARIS identity and evidence binding",
    description: "Return the canonical ARIS-9.7k specification identity, external-runtime evidence bundle identity, deployment identity, and explicit host-evidence boundaries.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "aris_conformance",
    title: "Run ARIS conformance",
    description: "Run the bounded ARIS runtime conformance harness and return its observed result. This does not self-authorize release or native ChatGPT host registration.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "aris_benchmark",
    title: "Run ARIS PBENCH",
    description: "Run the deterministic ARIS-SUPER v1.3 PBENCH candidate benchmark on the frozen executable corpus.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "aris_run",
    title: "Run bounded ARIS execution",
    description: "Run the bounded ARIS-9.7k executable baseline adapter on the frozen benchmark corpus. It is evidence-bound and does not claim full C001-C380 semantic execution or native-host equivalence.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  }
];

function result(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value
  };
}

function identity() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null;
  const deploymentUrl = process.env.VERCEL_URL || null;
  return {
    system: "ARIS-9.7k ChatGPT MCP adapter",
    server: SERVER_INFO,
    canonical_spec_sha256: CANONICAL_SPEC_SHA256,
    external_runtime_evidence_bundle_sha256: EXTERNAL_RUNTIME_BUNDLE_SHA256,
    implementation_hash: commit,
    implementation_hash_type: commit ? "git_commit_sha" : null,
    deployment_url: deploymentUrl,
    execution_id: crypto.randomUUID(),
    observed_at: new Date().toISOString(),
    registration_scope: "REMOTE_MCP_PLUGIN_CAPABILITY",
    explicit_nonclaims: {
      built_in_native_chatgpt_skill_registration: "UNVERIFIED_NOT_CLAIMED",
      physical_chatgpt_host_parallel_execution: "UNVERIFIED_NOT_CLAIMED",
      full_aris_9_7k_semantic_runtime_equivalence: "UNVERIFIED_NOT_CLAIMED"
    }
  };
}

function callTool(name) {
  if (name === "aris_identity") return identity();
  if (name === "aris_conformance") return runV13();
  if (name === "aris_benchmark") return runPBench();
  if (name === "aris_run") return run97kBaseline();
  throw new Error(`UNKNOWN_TOOL:${name}`);
}

function rpcError(id, code, message, data) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function rpcResult(id, value) {
  return { jsonrpc: "2.0", id, result: value };
}

export function handleMcpMessage(body) {
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return { status: 400, body: rpcError(body?.id, -32600, "Invalid Request") };
  }

  const { id, method, params = {} } = body;

  if (method === "initialize") {
    return {
      status: 200,
      body: rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: "Use ARIS tools only within their declared evidence scope. Do not infer built-in native ChatGPT registration from remote MCP connectivity."
      })
    };
  }

  if (method === "notifications/initialized") {
    return { status: 202, body: null };
  }

  if (method === "ping") {
    return { status: 200, body: rpcResult(id, {}) };
  }

  if (method === "tools/list") {
    return { status: 200, body: rpcResult(id, { tools }) };
  }

  if (method === "tools/call") {
    const name = params?.name;
    if (!tools.some(t => t.name === name)) {
      return { status: 200, body: rpcResult(id, { isError: true, content: [{ type: "text", text: `Unknown tool: ${String(name)}` }] }) };
    }
    try {
      return { status: 200, body: rpcResult(id, result(callTool(name))) };
    } catch (error) {
      return { status: 200, body: rpcResult(id, { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }] }) };
    }
  }

  return { status: 200, body: rpcError(id, -32601, "Method not found") };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,accept,mcp-protocol-version,mcp-session-id");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED", allowed: ["POST"] });

  const output = handleMcpMessage(req.body);
  if (output.body === null) return res.status(output.status).end();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(output.status).json(output.body);
}
