# ARIS-9.7n Runtime Instrumentation Contract
Spec identity is frozen at SHA-256 6a94851ef062e872d128c2ccf3aa05d6e9a0a0f4c0653a626f8f9e9b6de7c101.
This implementation observes execution_id, trace_id, span lineage, module activation, routing, state transitions, timing, failure return and interval overlap.
Qualification sequence: identity -> schema -> serial trace -> parallel trace -> failure injection -> invariant check -> runtime qualification -> deployment-bound reproduction.
Observed overlap is evidence only for this instrumented runtime. ARIS_RUNTIME_OBSERVED_PARALLELISM != CHATGPT_NATIVE_SCHEDULER_PARALLELISM. ARIS_RUNTIME_REGISTERED != CHATGPT_NATIVE_HOST_SKILL_REGISTERED.
Release remains WITHHELD; this runtime is evidence-producing, not self-authorizing.
