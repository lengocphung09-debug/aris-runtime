import {runConformance} from '../src/conformance.js';
const r=runConformance();console.log(JSON.stringify(r,null,2));if(r.fail)process.exit(1);
