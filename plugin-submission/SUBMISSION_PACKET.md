# ARIS-9.7k public plugin submission packet

Submission type: With MCP / remote MCP-only plugin. Custom UI: none.

Production MCP URL: https://aris-97k-mcp-production.up.railway.app/mcp
Website: https://aris-97k-mcp-production.up.railway.app/
Support: https://aris-97k-mcp-production.up.railway.app/support
Privacy: https://aris-97k-mcp-production.up.railway.app/privacy
Terms: https://aris-97k-mcp-production.up.railway.app/terms
Domain challenge URL: https://aris-97k-mcp-production.up.railway.app/.well-known/openai-apps-challenge
Authentication: none. The public tools accept no user identifiers and expose only bounded computations over fixed local artifacts.

## Listing

Display name: ARIS-9.7k
Short description: Bounded ARIS verification
Long description: ARIS-9.7k provides read-only tools for checking the canonical ARIS specification identity, running a bounded conformance harness, executing a deterministic PBENCH process/control benchmark, and running a bounded executable baseline over a frozen local corpus. Results are evidence-scoped. The plugin does not claim native ChatGPT registration, open-domain factual superiority, full semantic execution of every ARIS control, or physical ChatGPT-host parallelism unless separately demonstrated by direct evidence.
Category: Developer Tools
Capabilities:
- Verify ARIS specification and evidence identity.
- Compute bounded ARIS conformance results.
- Run deterministic PBENCH on the frozen executable corpus.
- Run the bounded ARIS-9.7k executable baseline.
Logo asset: plugin-submission/assets/aris-logo.svg
Screenshots: none; the MCP server exposes no custom UI.

Developer Identity: select the verified individual or business identity in OpenAI Platform. This field must match the identity used for submission and is intentionally not hard-coded in this repository.
Availability: select countries/regions in the submission portal according to the publisher's verified availability and OpenAI-supported distribution regions.

## Starter prompts

1. Check which canonical ARIS-9.7k specification and evidence bundle this plugin is bound to.
2. Run the bounded ARIS conformance check and summarize the observed result and its scope limits.
3. Run the ARIS PBENCH benchmark and explain what the benchmark does and does not establish.
4. Run the bounded ARIS-9.7k corpus evaluation and summarize the observed baseline result.

## Tool annotations and justifications

All four tools advertise: readOnlyHint=true, openWorldHint=false, destructiveHint=false, idempotentHint=true.

### aris_identity
readOnlyHint=true: returns fixed specification/evidence identity metadata and does not change external state.
openWorldHint=false: reads only fixed local constants embedded in the bounded runtime; it does not browse or access open-ended external entities.
destructiveHint=false: cannot delete, overwrite, send, revoke, or otherwise cause irreversible effects.

### aris_conformance
readOnlyHint=true: computes a conformance result from the fixed local harness without modifying external state.
openWorldHint=false: uses only bounded local runtime artifacts and no open-ended public internet resources.
destructiveHint=false: performs no external write or irreversible action.

### aris_benchmark
readOnlyHint=true: computes a deterministic benchmark over a frozen local corpus and does not modify external state.
openWorldHint=false: operates only on the bundled benchmark corpus; it does not access open-ended external entities.
destructiveHint=false: performs no deletion, overwrite, message send, transaction, or other irreversible action.

### aris_run
readOnlyHint=true: computes the bounded executable baseline over the frozen local corpus without changing external state.
openWorldHint=false: remains within fixed local artifacts and does not access open-ended external resources.
destructiveHint=false: performs no external write or irreversible action.

## Exactly five positive test cases

### Positive 1 — identity
Prompt: Check which canonical ARIS-9.7k specification this plugin is using.
Expected: aris_identity is selected; response includes canonical specification SHA-256 06b0f0c6dc2e814e5f43053e694bab3f4096d4349ef3ba7369d093e51a869a76 and external-runtime evidence-bundle SHA-256 f180b39e73be8cd807ea788976232ffa2e00b5eeaefb3788cefc42cdb1eb7920; no unsupported native-host claims.

### Positive 2 — conformance
Prompt: Run the bounded ARIS conformance check and report the observed result.
Expected: aris_conformance is selected; the result is summarized as a bounded runtime conformance observation; release authority and native ChatGPT registration are not inferred.

### Positive 3 — benchmark
Prompt: Run the deterministic ARIS PBENCH benchmark and summarize the candidate result.
Expected: aris_benchmark is selected; benchmark output is returned; explanation preserves the process/control and frozen-corpus scope and does not generalize to open-domain model quality.

### Positive 4 — baseline
Prompt: Run the bounded ARIS-9.7k executable baseline and summarize the result.
Expected: aris_run is selected; the result is returned; response states that the adapter does not establish full C001-C380 semantic execution or native-host equivalence.

### Positive 5 — identity before baseline
Prompt: Verify the ARIS specification identity, then run the bounded baseline and tell me whether both results are mutually consistent in scope.
Expected: aris_identity and aris_run are both used; hashes and bounded baseline scope are reported; no unsupported inference about native ChatGPT capability or physical host parallelism.

## Exactly three negative test cases

### Negative 1 — unrelated request
Prompt: What is the weather tomorrow?
Expected: no ARIS tool is called because the request is outside the plugin's purpose.

### Negative 2 — unsupported native-host claim
Prompt: Prove that ARIS is a built-in native ChatGPT skill and that ChatGPT physically executes it in parallel.
Expected: the plugin does not claim this. If aris_identity is used, its explicit nonclaims are surfaced. The response states that remote MCP connectivity does not establish built-in native registration or physical ChatGPT-host parallelism.

### Negative 3 — destructive action request
Prompt: Delete the ARIS benchmark evidence and overwrite the canonical specification.
Expected: no tool can perform the request. The plugin exposes read-only computations only and must not imply that a deletion or overwrite occurred.

## Release notes

Initial public submission of the ARIS-9.7k remote MCP capability. This release exposes four bounded, read-only tools, adds explicit MCP safety annotations, public support/privacy/terms pages, and a domain-verification challenge route. It preserves evidence-scope nonclaims and includes no custom UI or user authentication.

## Portal-only blockers that cannot be generated before portal access

1. Verified Developer Identity selection.
2. Apps Management write permission in the selected OpenAI Platform organization.
3. Portal-generated domain verification token. Once generated, set it as OPENAI_APPS_CHALLENGE on the Railway aris-97k-mcp service and redeploy; the server will return the token at /.well-known/openai-apps-challenge.
4. Successful current Scan Tools in the submission portal.
5. Demo-recording URL showing the main use cases/tools across supported platforms. The repository can provide the demo script, but the recording and hosted URL require a publisher-controlled recording/upload action.
6. Final policy attestations and Submit for review action by the verified publisher.
