import { runV13 } from "../src/v13/harness.js";
import { runPBench } from "../src/v13/pbench.js";
import { run97kBaseline } from "../src/baseline97k/runner.js";

const SERVER_INFO = { name: "aris-9.7k-chatgpt-plugin", version: "0.2.0" };
const PROTOCOL_VERSION = "2025-06-18";
const CANONICAL_SPEC_SHA256 = "06b0f0c6dc2e814e5f43053e694bab3f4096d4349ef3ba7369d093e51a869a76";
const EXTERNAL_RUNTIME_BUNDLE_SHA256 = "f180b39e73be8cd807ea788976232ffa2e00b5eeaefb3788cefc42cdb1eb7920";
const READ_ONLY_BOUNDED_ANNOTATIONS = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
  idempotentHint: true
};

const tools = [
  {
    name: "aris_identity",
    title: "Get ARIS specification identity",
    description: "Returns the canonical ARIS-9.7k specification hash, external-runtime evidence-bundle hash, server version, and explicit evidence boundaries. Use this when a user asks which ARIS artifact or evidence binding the plugin is using.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    outputSchema: {
      type: "object",
      properties: {
        system: { type: "string" },
        server: { type: "object" },
        canonical_spec_sha256: { type: "string" },
        external_runtime_evidence_bundle_sha256: { type: "string" },
        registration_scope: { type: "string" },
        explicit_nonclaims: { type: "object" }
      },
      required: ["system", "server", "canonical_spec_sha256", "external_runtime_evidence_bundle_sha256", "registration_scope", "explicit_nonclaims"],
      additionalProperties: false
    },
    annotations: READ_ONLY_BOUNDED_ANNOTATIONS
  },
  {
    name: "aris_conformance",
    title: "Check bounded ARIS conformance",
    description: "Computes the bounded ARIS runtime conformance result from the fixed local conformance harness. It does not modify external systems and does not authorize release or imply native ChatGPT registration.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: READ_ONLY_BOUNDED_ANNOTATIONS
  },
  {
    name: "aris_benchmark",
    title: "Run bounded ARIS benchmark",
    description: "Computes the deterministic ARIS-SUPER v1.3 PBENCH candidate benchmark over the frozen local executable corpus. It is a bounded process/control benchmark and does not establish open-domain model quality.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: READ_ONLY_BOUNDED_ANNOTATIONS
  },
  {
    name: "aris_run",
    title: "Run bounded ARIS corpus evaluation",
    description: "Computes the bounded ARIS-9.7k executable baseline over the frozen local benchmark corpus and returns the observed result. It does not claim full C001-C380 semantic execution, native-host equivalence, or physical ChatGPT-host parallelism.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: READ_ONLY_BOUNDED_ANNOTATIONS
  }
];

function result(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value
  };
}

function identity() {
  return {
    system: "ARIS-9.7k remote MCP capability",
    server: SERVER_INFO,
    canonical_spec_sha256: CANONICAL_SPEC_SHA256,
    external_runtime_evidence_bundle_sha256: EXTERNAL_RUNTIME_BUNDLE_SHA256,
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
        instructions: "Use ARIS tools only for the bounded research-governance and benchmark purposes described by each tool. All tools are read-only computations over fixed local artifacts. Do not infer built-in native ChatGPT registration, open-domain factual superiority, full ARIS-9.7k semantic equivalence, or physical ChatGPT-host parallelism from remote MCP connectivity."
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
