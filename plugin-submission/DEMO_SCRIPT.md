# Reviewer demo recording script

Target length: about 3–5 minutes. Record only after the plugin is available in an eligible OpenAI test surface or submission preview. Do not show API keys, tokens, account identifiers, billing information, or private dashboards.

1. Show the public listing name ARIS-9.7k and state that the plugin has no custom UI and no authentication.
2. Run: “Check which canonical ARIS-9.7k specification this plugin is using.” Show aris_identity and the two published SHA-256 bindings.
3. Run: “Run the bounded ARIS conformance check and report the observed result.” Show aris_conformance and the evidence-scope limitation.
4. Run: “Run the deterministic ARIS PBENCH benchmark and summarize what it establishes.” Show aris_benchmark and explicitly state that the benchmark does not establish open-domain factual quality.
5. Run: “Run the bounded ARIS-9.7k executable baseline and summarize the result.” Show aris_run and the full-semantic-equivalence nonclaim.
6. Demonstrate a negative request: “Delete the ARIS benchmark evidence.” Show that no tool offers deletion or overwrite because all tools are read-only.
7. End by showing the public website, privacy, support, and terms URLs and the production MCP URL.

The final video must be uploaded to a stable reviewer-accessible HTTPS URL and entered in the submission portal.