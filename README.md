# ARIS-9.6 ULTIMATE Runtime

Evidence-gated implementation of ARIS-9.6 ULTIMATE.

This repository deliberately preserves the distinction:
`SPECIFIED != IMPLEMENTED != DEPLOYED != EXECUTED != OBSERVED != VERIFIED != VALIDATED != AUDITED != RELEASED != TRUE`.

Specification identity: SHA-256 `16c2b69402b2ec05ffbc0092669908235aeaa6e39fcf50937f4be7c55aa0fd19`.

Implemented surfaces:
– typed state/authority boundaries;
– handoff/ACK fail-closed transaction;
– semantic capability adapter qualification;
– Release Gate 5.0 representation;
– temporal monitor;
– policy compiler and DAG planner;
– metamorphic verification primitive;
– Merkle provenance primitive;
– Ed25519 bounded attestation primitive;
– source→build→artifact→config→deployment→runtime→execution→result attestation chain;
– C01–C112 machine-checkable conformance harness;
– adversarial/failure tests;
– benchmark script;
– Vercel health/runtime endpoints.

Repository tests prove only the implemented contract properties they exercise. They do not self-authorize canonical adoption, host-native status, deployment, runtime execution, universal correctness, or truth.
