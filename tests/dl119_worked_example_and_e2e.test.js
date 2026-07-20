const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
// --- Exemplo trabalhado: Dedicacao Plena, 350h ja feitas antes + 50h este mes ---
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='plena';
document.getElementById('chkDL119').checked=true;
document.getElementById('inpDL119PriorHours').value='350';

const priorH=dl119PriorHours();
assertEqual(priorH, 350, 'priorH le o campo corretamente');
const thisMonthErHours=50;
const erHoursYear=round2(thisMonthErHours+priorH);
assertEqual(erHoursYear, 400, 'total anual = 350 prior + 50 deste mes');
assertEqual(dl119AnnualLimit('plena'), 250, 'limite anual Plena=250h');

const dctx={regime:'plena', hourly:currentHourly(), erEurTotal:0, erHoursTotal:0};
const r=computeDL119(erHoursYear, dctx, new Set(), {priorHours:priorH, isLastBlock:false});
assertEqual(r.excess, 150, 'excesso total = 400-250');
// priorExcess = 350-250=100h -> 2 blocos completos (96h) ja contados antes.
// totalExcess=150h -> 3 blocos completos (144h), sem o resto (6h, sem isLastBlock).
// delta: bloco1 e bloco2 ja pagos antes -> so o bloco3 (48h) e novo.
assertEqual(r.applies, true, 'aplica-se (ha excesso e blocos completos)');
assertEqual(r.blocks.length, 1, 'so 1 bloco novo este periodo (bloco3)');
assertEqual(r.blocks[0].n, 3, 'o bloco novo e o 3o');
assertEqual(r.blocks[0].hours, 48, 'bloco3 conta as 48h inteiras (unidade atomica)');
assertEqual(r.requalifiedHours, 48, 'requalifiedHours = as 48h do bloco novo');
assertClose(r.requalifiedEurAt1x, round2(48*currentHourly()), 'requalifiedEurAt1x = 48h a 1x o valor/hora');

// com majoracao (bloco 3 confirmado) -> valor do bloco sobe (tabela Art.5o)
const r2=computeDL119(erHoursYear, dctx, {has:()=>true}, {priorHours:priorH, isLastBlock:false});
assertEqual(r2.blocks[0].majorado, true, 'com majoracao: bloco fica marcado majorado');
assertEqual(r2.netIncentiveEur>r.netIncentiveEur, true, 'com majoracao: incentivo maior que sem majoracao');

// --- Fim-a-fim: calculate() com DL119 ativo nao rebenta, mesmo com muitas horas ER ---
switchPeriodMode('mensal');
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
let count=0;
for(const row of UI.manualRows){
  if(row.inMonth){ const dow=parseISO(row.date).getDay();
    if(dow>=1&&dow<=5 && count<20){ row.banco='noite'; count++; } }
}
calculate();
assertEqual(typeof UI.lastResult.totalErHours, 'number', 'calculate() com DL119 ativo corre sem excecao');
toggleDL119Block(1);
assertEqual([...UI.dl119MajBlocks].includes(1), true, 'toggleDL119Block(1) adiciona o bloco 1 ao Set');
toggleDL119Block(1);
assertEqual([...UI.dl119MajBlocks].includes(1), false, 'toggleDL119Block(1) outra vez remove-o');
document.getElementById('chkDL119').checked=false;
calculate();
assertEqual(document.querySelector('#summaryTable tfoot').innerHTML.includes('+DL119'), false, 'DL119 desligado: sem +DL119 no total');

console.log('OK: exemplo trabalhado (350h+50h Plena) + fim-a-fim de calculate()/toggleDL119Block() — '+CHECKS_RUN+' assercoes.');
`);
