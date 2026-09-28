import fs from 'node:fs';
import crypto from 'node:crypto';
import { runConformance } from '../src/conformance.js';
import { run97kBaseline } from '../src/baseline97k/runner.js';
import { runPBench } from '../src/v13/pbench.js';

const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');
fs.mkdirSync('audit-output',{recursive:true});
const conformance = runConformance();
const baseline = run97kBaseline();
const candidate = runPBench();
const write=(name,obj)=>{const text=JSON.stringify(obj,null,2);fs.writeFileSync(`audit-output/${name}`,text);return sha256(text);};
const manifest={
  generated_at:new Date().toISOString(),
  commit_sha:process.env.GITHUB_SHA||null,
  run_id:process.env.GITHUB_RUN_ID||null,
  files:{
    'conformance.json':write('conformance.json',conformance),
    'aris97k-baseline.json':write('aris97k-baseline.json',baseline),
    'v13-pbench.json':write('v13-pbench.json',candidate)
  }
};
fs.writeFileSync('audit-output/evidence-manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({status:'EVIDENCE_GENERATED',manifest},null,2));
