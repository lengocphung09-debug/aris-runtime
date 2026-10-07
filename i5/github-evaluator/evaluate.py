import json, hashlib, os, platform, sys, pathlib, datetime
root=pathlib.Path(__file__).resolve().parent
lock=json.loads((root/"TARGET-LOCK.json").read_text())
required=["EVALUATOR_IDENTITY","EVALUATOR_AFFILIATION","OUTSIDE_TARGET_TRUST_DOMAIN","EVALUATOR_CONTROLS_ADJUDICATION"]
missing=[k for k in required if not os.getenv(k)]
independent=os.getenv("OUTSIDE_TARGET_TRUST_DOMAIN","").lower()=="true"
controlled=os.getenv("EVALUATOR_CONTROLS_ADJUDICATION","").lower()=="true"
verdict="BLOCKED"
reasons=[]
if missing: reasons.append("missing evaluator declarations: "+",".join(missing))
if not independent: reasons.append("outside-target-trust-domain not established")
if not controlled: reasons.append("evaluator-controlled adjudication not established")
if not reasons:
    verdict="BLOCKED"
    reasons.append("identity/independence prerequisites satisfied; evaluator must independently inspect supplied artifacts/raw evidence and replace this BLOCKED result with evidence-grounded PASS/FAIL/BLOCKED adjudication")
out={
 "schema":"RVEH-I5-GITHUB-EVALUATOR-1",
 "timestamp_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "evaluator_identity":os.getenv("EVALUATOR_IDENTITY"),
 "evaluator_affiliation":os.getenv("EVALUATOR_AFFILIATION"),
 "outside_target_trust_domain":independent,
 "evaluator_controlled_execution_or_adjudication":controlled,
 "target_lock":lock,
 "environment":{"python":sys.version,"platform":platform.platform(),"github_repository":os.getenv("GITHUB_REPOSITORY"),"github_sha":os.getenv("GITHUB_SHA"),"github_actor":os.getenv("GITHUB_ACTOR")},
 "verdict":verdict,"reasoning":reasons,
 "warning":"Infrastructure-generated output is not I5 unless controlled and adjudicated by a genuinely independent evaluator."
}
pathlib.Path("i5-result.json").write_text(json.dumps(out,indent=2))
print(json.dumps(out,indent=2))
