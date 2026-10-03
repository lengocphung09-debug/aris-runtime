# ARIS-SUPER v1.6 Instrumented Runtime Qualification Contract
Spec SHA-256: 1b6d21e23391fd34441534c575068f5504e5a5dce3268a160a9900f91fa4a8c0.
Qualification sequence: identity -> schema -> serial trace -> real async concurrent trace -> handoff/ACK observation -> failure injection/return -> invariant check -> paired runtime microbenchmark -> deployment-bound reproduction.
Telemetry uses monotonic performance timing for measured spans. Synthetic future timestamps are prohibited as concurrency evidence.
Async overlap establishes concurrency only inside this Node runtime. Worker-level physical parallelism requires worker/process evidence. ChatGPT native scheduler parallelism requires native-host telemetry and remains UNVERIFIED_NOT_CLAIMED.
The runtime is evidence-producing and not self-authorizing. Release/canonicalization authority remains external.
