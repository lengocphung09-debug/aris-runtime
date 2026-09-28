# ARIS-SUPER v1.3 — Independent PBENCH Audit Checklist

Package: ARIS-SUPER-v1.3-PBENCH-INDEPENDENT-AUDIT-PACKAGE-20260928

This checklist is for an auditor independent of the implementation/benchmark agent. Do not mark PASS from this template alone.

- [ ] Verify production commit is 6d58dbb8d544127aae35031d207b66d5bfb50980.
- [ ] Verify deployment dpl_CT3sSHhP24fTrHvNML7DR43XQCes corresponds to that commit.
- [ ] Verify canonical v1.3 source SHA-256 is bb406627e31052bde176f33681b056c7c545def7cc87dca3d240178389e4e763.
- [ ] Verify bound ARIS-9.7k source SHA-256 is 06b0f0c6dc2e814e5f43053e694bab3f4096d4349ef3ba7369d093e51a869a76.
- [ ] Verify ARIS-BENCH-1 revision 1.0-derived-executable and corpus blob 346a88b7a02d3fbbd8d303967b802f3d937ae2cd.
- [ ] Verify all 80 cases remain present and no hidden deletion/exclusion occurred.
- [ ] Verify threshold contract blob e7d51b66e75104eafe75aae7a74ca6f078ddd13b and human approval record predate this paired adjudication.
- [ ] Verify baseline and candidate use the same corpus, fixtures, run count, clock family, missing-data and exclusion policy.
- [ ] Verify 400 baseline and 400 candidate observations are represented by the paired execution.
- [ ] Verify reported C38/C45/C46 decisions follow the locked threshold contract without postselection.
- [ ] Verify protected dimensions show no observed regression within the declared deterministic process/control envelope.
- [ ] Verify any physical-parallelism claim is supported only by the separate PEXV direct traces and is bounded to that tested envelope.
- [ ] Verify failure/recovery evidence is present where a benchmark case requires it; do not infer untested failure classes.
- [ ] Verify reproduction and traceability requirements.
- [ ] Verify evidence identities/hashes and note any evidence that is only runtime-observed rather than repository-retained.
- [ ] Verify no conflict of authority: preparer is not accepted as independent auditor.
- [ ] Verify claims do not exceed the tested environment/workload envelope.
- [ ] Record material qualifications, omissions, or contradictions.

Final disposition: one of AUDIT_PASS / AUDIT_PASS_WITH_QUALIFICATION / AUDIT_FAIL / AUDIT_INCONCLUSIVE.

The independent auditor must create the attestation from independent-audit-attestation.template.json and identify their role/review evidence.
