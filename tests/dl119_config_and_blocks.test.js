const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
const base=currentMonthlyBase();
assertClose(base, 3538.87, 'vencimento base Assistente/Geral');

// --- Tabela base (Art.4o/3), incluindo o 4o bloco corrigido para 52,5% ---
const baseExpected=[45.0,47.5,50.0,52.5,56.0,59.5,63.0,68.0,75.5,85.5];
DL119_RULES.baseTable.forEach((b,i)=>assertEqual(b.pct, baseExpected[i], 'baseTable bloco '+b.n));

// --- Tabela majorada (Art.5o): tem de ser EXATAMENTE base x1.2 em todos os blocos ---
DL119_RULES.baseTable.forEach((b,i)=>{
  const maj=DL119_RULES.majTable[i].pct;
  assertClose(maj, round2(b.pct*1.2), 'majTable bloco '+b.n+' = base x1.2');
});

// --- Limite anual por regime ---
assertEqual(dl119AnnualLimit('geral'), 150, 'limite geral');
assertEqual(dl119AnnualLimit('exclusiva'), 150, 'limite exclusiva');
assertEqual(dl119AnnualLimit('plena'), 250, 'limite plena');

const dctx={regime:'geral', hourly:20.42, erEurTotal:1000, erHoursTotal:50};

// Abaixo de 48h de excesso -> nao aplica
const r1=computeDL119(150+30, dctx, new Set());
assertEqual(r1.applies, false, '30h excesso nao aplica (sem 1o bloco completo)');

// Exatamente 48h de excesso -> 1 bloco completo, sem parcial
const r2=computeDL119(150+48, dctx, new Set());
assertEqual(r2.applies, true, '48h excesso aplica');
assertEqual(r2.blocks.length, 1, '48h excesso -> 1 bloco');
assertEqual(r2.blocks[0].hours, 48, 'bloco 1 tem 48h');
assertEqual(r2.blocks[0].pct, 45, 'bloco 1 pct=45');
assertClose(r2.blocks[0].value, round2(0.45*base), 'bloco 1 valor = 45% do vencimento base');

// 60h de excesso, SEM confirmar ultimo bloco -> so o bloco1 completo conta
// (o resto, 12h, fica de fora ate fechar um bloco de 48h -- Art.4o/3)
const r3zero=computeDL119(150+60, dctx, new Set());
assertEqual(r3zero.blocks.length, 1, '60h excesso sem isLastBlock -> so 1 bloco completo');

// com isLastBlock (ultimo bloco autorizado do ano civil, Art.4o/4) -> o
// remanescente entra como bloco parcial proporcional
const r3=computeDL119(150+60, dctx, new Set(), {isLastBlock:true});
assertEqual(r3.blocks.length, 2, '60h excesso com isLastBlock -> 2 blocos (1 completo + 1 parcial)');
assertEqual(r3.blocks[1].hours, 12, 'bloco2 parcial = 12h');
const expBloco2=round2((47.5/100*base/48)*12);
assertClose(r3.blocks[1].value, expBloco2, 'valor do bloco2 parcial (12h a 47.5%)');
assertClose(r3.netIncentiveEur, round2(0.45*base+expBloco2), 'netIncentiveEur = soma dos 2 blocos');

// Majoracao: bloco 1 marcado como majorado -> usa a tabela do Art.5o
const r4=computeDL119(150+48, dctx, new Set([1]));
assertEqual(r4.blocks[0].pct, 54, 'bloco1 majorado usa 54%');
assertEqual(r4.blocks[0].majorado, true, 'bloco1 fica marcado majorado=true');
assertClose(r4.blocks[0].value, round2(0.54*base), 'valor do bloco1 majorado');

// Mais de 10 blocos (excesso 520h = 10x48+40) -> bloco 11 usa a percentagem do bloco 10
const r5=computeDL119(150+520, dctx, new Set(), {isLastBlock:true});
const last=r5.blocks[r5.blocks.length-1];
assertEqual(last.n, 11, 'ultimo bloco e o 11o');
assertEqual(last.pct, 85.5, 'bloco>10 usa a pct do bloco 10 (85.5%)');

console.log('OK: DL119_RULES (tabelas base/majorada), dl119AnnualLimit(), computeDL119() (limiar/blocos/majoracao/bloco>10) — '+CHECKS_RUN+' assercoes.');
`);
