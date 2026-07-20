/* Corre todos os tests/*.test.js num processo filho cada, e imprime um
   resumo final. Sai com código 1 se algum falhar (útil em CI ou como
   verificação rápida antes de commitar).
   Uso: node tests/run-all.js
   ========================================================================= */
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const dir=__dirname;
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.test.js')).sort();

let pass=0, fail=0;
const failures=[];

for(const f of files){
  const full=path.join(dir,f);
  try{
    const out=execFileSync(process.execPath, [full], {encoding:'utf8'});
    process.stdout.write(`✓ ${f}\n  ${out.trim().split('\n').pop()}\n`);
    pass++;
  }catch(e){
    process.stdout.write(`✗ ${f}\n`);
    const out=(e.stdout||'')+(e.stderr||e.message||'');
    process.stdout.write(out.trim().split('\n').map(l=>'  '+l).join('\n')+'\n');
    fail++;
    failures.push(f);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`${pass} ficheiro(s) OK, ${fail} falharam (de ${files.length} no total)`);
if(failures.length){
  console.log('Falharam: ' + failures.join(', '));
  process.exitCode=1;
}
