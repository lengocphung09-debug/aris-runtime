# RVEH I5 — GitHub-first independent evaluation

This directory is a handoff surface, not self-attestation.

## Independence rule
A project-owner run does **not** satisfy I5. An evaluator outside the target-development trust domain should fork or clone the repository, control execution and/or adjudication, independently inspect the frozen artifacts and raw evidence, and return PASS, FAIL, or BLOCKED with reasoning.

## Target identities
- Frozen predecessor RVEH v2.3 SHA-256: `9dedc765cd824f5eb60f62f0de5243860105f3a7e213afbcae72aa8dd01d7de2`
- v2.3.1 successor-closure evidence SHA-256: `401d085eb99b2f0d92bda997e38b335d960711f4d573689003638d282300df5c`

They are not interchangeable. Any mismatch is BLOCKED.

## Evaluator procedure
1. Fork/clone under evaluator control.
2. Verify the two target identities against the supplied frozen artifacts.
3. Set evaluator identity/affiliation and independence declarations.
4. Run the workflow under evaluator control.
5. Independently inspect raw evidence; do not inherit the owner's PASS assertions.
6. Return raw evidence, its SHA-256, environment/provenance, and PASS/FAIL/BLOCKED reasoning.
7. Do not weaken acceptance criteria.

The included script deliberately defaults to BLOCKED. It cannot manufacture an I5 PASS.
