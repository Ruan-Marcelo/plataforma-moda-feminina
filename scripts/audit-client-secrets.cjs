const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const names = Object.keys(process.env).filter(name => /SECRET|PASSWORD|API_KEY|ACCESS_KEY|DATABASE_URL/.test(name) && !name.startsWith('NEXT_PUBLIC_') && (process.env[name] || '').length >= 8);
const hits = [];
let filesChecked = 0;
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(file);
    else if (/\.(js|map)$/.test(entry.name)) {
      filesChecked++;
      const text = fs.readFileSync(file, 'utf8');
      for (const name of names) if (text.includes(process.env[name])) hits.push({ file: path.relative(process.cwd(), file), variable: name });
    }
  }
}
inspect('.next/static');
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const forbiddenTracked = tracked.filter(file => /^\.env(?:$|\.(?:local|production|development)(?:\.local)?$)/.test(file) || /^\.(?:local-data|codex)\//.test(file));
console.log(JSON.stringify({ filesChecked, configuredSensitiveVariablesChecked: names.length, hits, forbiddenTracked }));
if (hits.length || forbiddenTracked.length) process.exitCode = 1;
