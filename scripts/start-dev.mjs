import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli=fileURLToPath(new URL('../node_modules/vinext/dist/cli.js',import.meta.url));
const supportsSystemCa=process.allowedNodeEnvironmentFlags.has('--use-system-ca');
const existingNodeOptions=process.env.NODE_OPTIONS?.trim()||'';
const nodeOptions=supportsSystemCa&&!existingNodeOptions.includes('--use-system-ca')
  ? `${existingNodeOptions} --use-system-ca`.trim()
  : existingNodeOptions;

const child=spawn(process.execPath,[cli,'dev',...process.argv.slice(2)],{
  cwd:process.cwd(),
  env:{...process.env,...(nodeOptions?{NODE_OPTIONS:nodeOptions}:{})},
  stdio:'inherit',
});

child.on('error',error=>{
  console.error(`Unable to start DocBeans: ${error.message}`);
  process.exitCode=1;
});
child.on('exit',(code,signal)=>{
  process.exitCode=typeof code==='number'?code:signal?1:0;
});
