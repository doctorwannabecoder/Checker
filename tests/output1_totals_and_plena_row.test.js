const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selStartYear').value='2026';

function calcFor(mode, regime){
  switchPeriodMode(mode);
  document.getElementById('selRegime').value=regime;
  if(mode==='mensal'){ document.getElementById('selStartMonth').value='5'; updatePeriodAvailability(); buildCalendar(); }
  if(mode==='variavel'){ document.getElementById('selStartMonth').value='4'; document.getElementById('selEndMonth').value='6'; onStartMonthChange(); }
  document.getElementById('chkDL119').checked=false;
  calculate();
}

// --- Linha TOTAL (base+extra) tem de existir e ser distinta da linha "extra" -- nos 3 modos ---
['mensal','anual','variavel'].forEach(mode=>{
  calcFor(mode,'geral');
  const tf=document.querySelector('#summaryTable tfoot').innerHTML;
  assertEqual(tf.includes('TOTAIS'), true, mode+': linha de totais de extra presente');
  assertEqual(tf.includes('TOTAL'), true, mode+': linha TOTAL (base+extra) presente');
});

// --- Suplemento Dedicacao Plena: linha PROPRIA no corpo da tabela (RegHAcr. Ded.Plena),
// nao so uma nota no rodape -- e o valor tem de SOMAR ao mesmo total (Base reduzida + suplemento) ---
calcFor('mensal','plena');
let pb=periodBaseWithSubsidios();
let sup=plenaSupplementOf(pb.total);
let tb=document.querySelector('#summaryTable tbody').innerHTML;
assertEqual(tb.includes('RegHAcr. Ded.Plena'), true, 'Plena: linha propria RegHAcr. Ded.Plena presente no corpo');
const rows=tb.split('<tr>');
const baseRow=rows.find(r=>r.includes('>Base<'));
const supRow=rows.find(r=>r.includes('RegHAcr. Ded.Plena'));
assertEqual(baseRow.includes(eur(round2(pb.total-sup))), true, 'Plena: linha Base mostra o valor SEM o suplemento');
assertEqual(supRow.includes(eur(sup)), true, 'Plena: linha RegHAcr. Ded.Plena mostra exatamente o suplemento');
let tf=document.querySelector('#summaryTable tfoot').innerHTML;
assertEqual(tf.includes('inclui suplemento Dedicação Plena'), true, 'Plena: TOTAL menciona que inclui o suplemento');

// --- Regime Geral: sem linha de suplemento nenhures ---
calcFor('mensal','geral');
tb=document.querySelector('#summaryTable tbody').innerHTML;
assertEqual(tb.includes('RegHAcr. Ded.Plena'), false, 'Geral: sem linha de suplemento Plena');

console.log('OK: Output 1 -- linha TOTAL (base+extra) e linha propria do suplemento Plena, nos 3 modos — '+CHECKS_RUN+' assercoes.');
`);
