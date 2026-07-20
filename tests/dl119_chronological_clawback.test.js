const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
// --- flattenErAllocations / sumTailErValue (unidades) ---
const shifts=[
  {allocations:[{isER:true, hours:10, eur:100}]},   // dia 1: 10h a 10eur/h
  {allocations:[{isER:false, hours:5, eur:0}]},      // TN, ignorado (nao e ER)
  {allocations:[{isER:true, hours:5, eur:100}]},     // dia 2: 5h a 20eur/h
  {allocations:[{isER:true, hours:20, eur:100}]},    // dia 3: 20h a 5eur/h (mais barato)
];
const allocs=flattenErAllocations(shifts);
assertEqual(allocs.reduce((s,a)=>s+a.hours,0), 35, 'flattenErAllocations: total horas ER (ignora TN)');
assertEqual(allocs.reduce((s,a)=>s+a.eur,0), 300, 'flattenErAllocations: total eur ER');

assertClose(sumTailErValue(allocs,3), 15, 'sumTailErValue(3h): 3h do ultimo dia (5eur/h) = 15');
assertClose(sumTailErValue(allocs,20), 100, 'sumTailErValue(20h): dia3 inteiro = 100');
assertClose(sumTailErValue(allocs,25), 200, 'sumTailErValue(25h): dia3(100)+dia2 inteiro(100)=200');

// --- computeDL119: clawback EXATO (por turno real) vs APROXIMADO (media do periodo) ---
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='plena';
const hourly=currentHourly();
// 300h ER no ano (excesso=50h -> 1 bloco completo de 48h). As ULTIMAS 50h
// (cronologicamente) sao deliberadamente BARATAS (5eur/h fixo) para que o
// exato e o aproximado difiram claramente.
const bigShifts=[
  {allocations:[{isER:true, hours:200, eur:200*hourly*1.75}]},  // horas caras, mais antigas
  {allocations:[{isER:true, hours:50, eur:50*5}]},              // as ULTIMAS 50h, baratas
];
const dctxExact={regime:'plena', hourly, erEurTotal:200*hourly*1.75+50*5, erHoursTotal:250, erAllocs:flattenErAllocations(bigShifts)};
const rExact=computeDL119(300, dctxExact, new Set(), {priorHours:0, isLastBlock:false});
assertEqual(rExact.applies, true, 'excesso=50h aplica (1 bloco completo)');
assertEqual(rExact.requalifiedHours, 48, 'requalifiedHours = 1 bloco = 48h');
assertEqual(rExact.clawbackIsExact, true, 'com erAllocs, clawbackIsExact=true');
assertClose(rExact.clawbackEur, 240, 'clawback exato: 48h das ultimas horas baratas (5eur/h) = 240');

const dctxApprox={regime:'plena', hourly, erEurTotal:200*hourly*1.75+50*5, erHoursTotal:250};
const rApprox=computeDL119(300, dctxApprox, new Set(), {priorHours:0, isLastBlock:false});
assertEqual(rApprox.clawbackIsExact, false, 'sem erAllocs, clawbackIsExact=false (cai para a media)');
assertEqual(rApprox.clawbackEur > rExact.clawbackEur, true,
  'aproximado (media do periodo) sobrestima o clawback quando as horas em excesso sao mais baratas que a media');

console.log('OK: flattenErAllocations()/sumTailErValue() + computeDL119() clawback exato vs aproximado — '+CHECKS_RUN+' assercoes.');
`);
