import http from "node:http";
import { handleMcpMessage } from "./api/mcp.js";

const port = Number(process.env.PORT || 8787);

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
    return sendJson(res,200,{status:"ok",service:"aris-9.7k-chatgpt-plugin"});
  }

  if (req.url !== "/mcp") {
    return sendJson(res,404,{error:"NOT_FOUND",routes:["/health","/mcp"]});
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
  console.log(JSON.stringify({service:"aris-9.7k-chatgpt-plugin",status:"listening",port,mcp_url:`http://0.0.0.0:${port}/mcp`}));
});
