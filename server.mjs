import http from "node:http";
import { handleMcpMessage } from "./api/mcp.js";

const port = Number(process.env.PORT || 8787);
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || "https://aris-97k-mcp-production.up.railway.app";

const sendJson = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS,GET",
    "access-control-allow-headers": "content-type,accept,mcp-protocol-version,mcp-session-id"
  });
  res.end(payload);
};

const sendText = (res, status, body, contentType = "text/plain; charset=utf-8") => {
  res.writeHead(status, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(body),
    "cache-control": "public, max-age=300"
  });
  res.end(body);
};

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body><main><h1>${title}</h1>${body}</main></body></html>`;

const routes = {
  "/": page("ARIS-9.7k", `<p>ARIS-9.7k exposes bounded, read-only research-governance and benchmark tools through a public MCP endpoint.</p><p>MCP endpoint: <code>${PUBLIC_ORIGIN}/mcp</code></p><p>This service does not claim native ChatGPT registration, full semantic equivalence to every ARIS control, or physical ChatGPT-host parallel execution.</p>`),
  "/support": page("ARIS-9.7k Support", `<p>For support, open an issue at <a href="https://github.com/lengocphung09-debug/aris-runtime/issues">the ARIS runtime GitHub repository</a>.</p><p>Include the tool name, expected behavior, and observed result. Do not include API keys, access tokens, passwords, or other secrets.</p>`),
  "/privacy": page("ARIS-9.7k Privacy Policy", `<p>The public ARIS-9.7k MCP tools accept no user identifiers and require no authentication. The tools operate on fixed local specification, conformance, and benchmark artifacts.</p><p>The service does not intentionally request or return personal data, chat transcripts, account identifiers, credentials, or authentication secrets. Hosting infrastructure may process ordinary network metadata needed to deliver HTTPS requests.</p><p>Tool outputs are limited to bounded computation and evidence results. Do not submit sensitive or personal information to this service.</p>`),
  "/terms": page("ARIS-9.7k Terms of Use", `<p>ARIS-9.7k is provided for bounded research-governance, conformance, benchmark, and reproducibility workflows.</p><p>Outputs are evidence scoped. They do not establish universal correctness, open-domain factual superiority, native ChatGPT registration, full ARIS semantic equivalence, or physical ChatGPT-host parallel execution unless separately demonstrated by direct evidence.</p><p>Do not use the service to make unsupported safety-critical, legal, medical, financial, or other high-stakes determinations.</p>`)
};

const server = http.createServer(async (req,res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS,GET",
      "access-control-allow-headers": "content-type,accept,mcp-protocol-version,mcp-session-id"
    });
    return res.end();
  }

  if (req.url === "/health" && req.method === "GET") {
    return sendJson(res,200,{status:"ok",service:"aris-9.7k",mcp:`${PUBLIC_ORIGIN}/mcp`});
  }

  if (req.url === "/.well-known/openai-apps-challenge" && req.method === "GET") {
    const token = process.env.OPENAI_APPS_CHALLENGE;
    if (!token) return sendText(res,404,"OPENAI_APPS_CHALLENGE_NOT_CONFIGURED");
    return sendText(res,200,token);
  }

  if (req.method === "GET" && Object.hasOwn(routes, req.url)) {
    return sendText(res,200,routes[req.url],"text/html; charset=utf-8");
  }

  if (req.url !== "/mcp") {
    return sendJson(res,404,{error:"NOT_FOUND",routes:["/","/health","/mcp","/support","/privacy","/terms","/.well-known/openai-apps-challenge"]});
  }

  if (req.method !== "POST") {
    return sendJson(res,405,{error:"METHOD_NOT_ALLOWED",allowed:["POST"]});
  }

  let raw="";
  for await (const chunk of req) raw += chunk;
  let body;
  try { body = JSON.parse(raw || "{}"); }
  catch { return sendJson(res,400,{jsonrpc:"2.0",id:null,error:{code:-32700,message:"Parse error"}}); }

  const output = handleMcpMessage(body);
  if (output.body === null) {
    res.writeHead(output.status,{"cache-control":"no-store","access-control-allow-origin":"*"});
    return res.end();
  }
  return sendJson(res,output.status,output.body);
});

server.listen(port,"0.0.0.0",()=>{
  console.log(JSON.stringify({service:"aris-9.7k",status:"listening",port,mcp_url:`${PUBLIC_ORIGIN}/mcp`}));
});
