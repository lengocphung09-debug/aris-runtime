# ARIS-9.6 ULTIMATE — External Independent Audit Protocol

Status: NORMATIVE AUDIT GATE

This protocol exists to prevent the implementation author, repository owner, deployment operator, or the same AI agent that produced the implementation from self-certifying release.

## Independence requirement

An acceptable reviewer must be a distinct reviewer identity from the implementation author/operator for the audited release. The reviewer must independently inspect the normative specification, implementation, test oracles, production evidence, sibling capability contracts, and release blockers.

The audit is not satisfied by:

- green CI alone;
- the same agent rerunning its own tests;
- source/config presence;
- production reachability alone;
- a valid cryptographic signature alone;
- a GitHub review with no oracle or semantic-compatibility analysis.

## Required audit objects

The reviewer SHALL produce `audit/independent-attestation.json` conforming to `audit/independent-attestation.schema.json` and SHALL provide evidence references for each conclusion.

Required determinations:

1. `normative_oracle_coverage`: whether C01-C112 executable checks faithfully test the corresponding normative requirements rather than merely returning PASS.
2. `vlf_semantic_compatibility`: schema, semantics, authority boundary, failure semantics, provenance, and version-compatibility against accessible canonical VLF evidence.
3. `text_metrics_semantic_compatibility`: schema, semantics, authority boundary, failure semantics, provenance, and version-compatibility against the current Text-Metrics implementation/profile.
4. `production_reproduction`: independent reproduction of health/runtime/adversarial/provenance/concurrency/final-audit evidence.
5. `release_gate_5`: confirmation that no material blocker remains before any RELEASED claim.

## Reviewer method

The reviewer SHOULD:

- inspect ARIS-9.6 ULTIMATE normative specification and its C01-C112 definitions;
- map each applicable C-test to a concrete oracle and failure condition;
- sample and challenge positive and negative paths;
- inspect source implementation rather than trusting endpoint summaries;
- reproduce production endpoints from a separate execution environment where feasible;
- verify that VLF and Text-Metrics remain bounded sibling capabilities and do not absorb Kernel/Master authority;
- verify runtime evidence does not overclaim universal truth or host-wide scheduler guarantees;
- record disagreements, limitations, and unresolved material issues.

## Release rule

`EXTERNAL_INDEPENDENT_AUDIT = PASS` only when every required determination is PASS and the attestation validator accepts the reviewer identity and evidence structure.

Even then, the audit does not itself release ARIS. It only closes the independent-audit blocker. Kernel/release authority must perform a separate release adjudication.
