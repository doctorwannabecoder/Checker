const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='plena';
document.getElementById('selStartYear').value='2026';

// --- Output 3, periodo COMPLETO (12 meses reais): usa o ajuste DL119 REAL diretamente ---
switchPeriodMode('anual');
const fakeResult={totalExtraEur:1000, totalErHours:300};
const fakeDl119={applies:true, netAdjustmentEur:777.77};
renderAnnual(fakeResult, fakeDl119, null);
const tbFull=document.querySelector('#annualTable tbody').innerHTML;
const tfFull=document.querySelector('#annualTable tfoot').innerHTML;
assertEqual(tbFull.includes('DL119'), true, 'full: linha DL119 presente na tabela');
assertEqual(tbFull.includes('777,77'), true, 'full: valor real (777,77) aparece na linha');
assertEqual(tbFull.includes('dados inseridos'), true, 'full: nota indica dados reais, nao projecao');
const pbFull=periodBaseWithSubsidios();
const expectedTotalFull=round2(pbFull.total+1000+777.77);
assertEqual(tfFull.includes(eur(expectedTotalFull)), true, 'full: TOTAL ANUAL = base + extra + DL119 real');

// dl119 nao aplica -> sem linha
renderAnnual(fakeResult, {applies:false}, null);
assertEqual(document.querySelector('#annualTable tbody').innerHTML.includes('DL119'), false, 'full, applies=false: sem linha DL119');

// --- Output 3, periodo PARCIAL (Variavel): NAO escala o ajuste real x12/n
// (nao-linear) -- usa dl119Projected, recalculado sobre o total anual projetado ---
switchPeriodMode('variavel');
document.getElementById('selStartMonth').value='3';
document.getElementById('selEndMonth').value='8';
onStartMonthChange();
document.getElementById('chkDL119').checked=true;
document.getElementById('inpDL119PriorHours').value='260';   // ja > 250h (limite plena)
calculate();
assertEqual(numMeses(), 6, 'Variavel Mar-Ago = 6 meses');
const tbProj=document.querySelector('#annualTable tbody').innerHTML;
assertEqual(tbProj.includes('DL119'), true, 'parcial: linha DL119 (projecao) presente');
assertEqual(tbProj.includes('projeção'), true, 'parcial: rotulada como projecao, nao dados reais');
// Output 1 (periodo REAL, 0h ER de facto inseridas) deve continuar em 0 --
// a projecao do Output 3 nao deve "contaminar" o Output 1.
const summaryTf=document.querySelector('#summaryTable tfoot').innerHTML;
assertEqual(summaryTf.includes('+DL119'), false, 'Output 1 (periodo real, sem horas ER inseridas) continua sem DL119');

console.log('OK: renderAnnual() com DL119 (real no periodo completo, projetado no periodo parcial) — '+CHECKS_RUN+' assercoes.');
`);
