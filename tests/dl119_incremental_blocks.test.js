const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
const dctx={regime:'geral', hourly:20.42, erEurTotal:0, erHoursTotal:0};

// --- Blocos incrementais: nao duplicar o que ja foi "pago" num periodo anterior ---
// limite geral=150h. priorHours=210h -> priorExcess=60h -> bloco1 JA estava
// completo (48h) antes deste periodo (ja deve ter sido pago entao). Os 12h
// restantes da priorExcess NUNCA chegaram a fechar um bloco (dl119BuildBlocks
// para prioBlocks usa sempre allowPartialLast=false) por isso NAO contam como
// "ja pagos" -- ficam disponiveis para completar o bloco2 quando ele fechar.
// Este periodo soma +40h -> total=250h -> excesso total=100h -> bloco1
// (ja pago antes, nao aparece) + bloco2 completo (96h cumulativas: as 12h
// antigas + as 40h novas fecham-no agora) + 4h que ainda nao fecham bloco3.
const priorH=210, erHoursYear=250;
const r=computeDL119(erHoursYear, dctx, new Set(), {priorHours:priorH, isLastBlock:false});
assertEqual(r.excess, 100, 'excesso total = 250-150');
// bloco1 (48h) ja estava TODO coberto pelas 60h de excesso previas -> nao aparece
assertEqual(r.blocks.some(b=>b.n===1), false, 'bloco1 (ja todo pago antes) nao aparece no delta');
const b2=r.blocks.find(b=>b.n===2);
// Um bloco e uma unidade de pagamento atomica: quem o COMPLETA recebe o
// bloco inteiro (48h), independentemente de quantas dessas horas vieram de
// excesso acumulado num periodo anterior que nunca tinha sido pago.
assertEqual(b2.hours, 48, 'bloco2 completa-se agora -> conta as 48h inteiras (unidade atomica de pagamento)');
assertEqual(b2.continuing, false, 'bloco2 nao tinha nenhuma hora "paga" antes (a priorExcess parcial nunca fechou um bloco)');
const totalDeltaHours=r.blocks.reduce((s,b)=>s+b.hours,0);
assertEqual(totalDeltaHours, 48, 'soma das horas dos blocos mostrados = so o bloco2, que fecha agora');

// --- Bloco final proporcional (Art.4o/4): so entra com isLastBlock ---
const rNoLast=computeDL119(180, dctx, new Set(), {priorHours:0, isLastBlock:false});
assertEqual(rNoLast.applies, false, 'sem isLastBlock, 30h de excesso nao aplica (nao fecha 1o bloco)');

const rLast=computeDL119(180, dctx, new Set(), {priorHours:0, isLastBlock:true});
assertEqual(rLast.applies, true, 'com isLastBlock, 30h de excesso ja aplica (proporcional)');
assertEqual(rLast.blocks.length, 1, 'com isLastBlock -> 1 bloco parcial');
assertEqual(rLast.blocks[0].hours, 30, 'bloco parcial tem as 30h todas');
assertEqual(rLast.blocks[0].pct, 45, 'bloco parcial usa a pct do bloco 1 (45%)');

// isLastBlock mas excesso=0 -> continua sem aplicar (nada a pagar)
const rLastZero=computeDL119(150, dctx, new Set(), {priorHours:0, isLastBlock:true});
assertEqual(rLastZero.applies, false, 'isLastBlock com excesso=0 continua sem aplicar');

// --- Casos extra (prior perto do limiar) ---
// prior=140h + periodo=24h -> total=164h, excesso=14h (<48h) -> nao aplica
const rA=computeDL119(164, dctx, new Set(), {priorHours:140, isLastBlock:false});
assertEqual(rA.excess, 14, 'caso A: excesso=14h');
assertEqual(rA.applies, false, 'caso A: 14h de excesso nao aplica');

// prior=200h + periodo=24h -> total=224h, excesso=74h. priorExcess=200-150=50h,
// que JA continha 1 bloco completo (48h) -- ou seja bloco1 JA foi pago antes
// deste periodo. Sem isLastBlock, os 74h de excesso so completam o bloco1
// (ja pago) -- delta=0, nao ha nada de novo a pagar neste periodo.
const rB=computeDL119(224, dctx, new Set(), {priorHours:200, isLastBlock:false});
assertEqual(rB.excess, 74, 'caso B: excesso=74h');
assertEqual(rB.blocks.length, 0, 'caso B sem isLastBlock: bloco1 ja tinha sido pago antes, nada de novo');

// com isLastBlock, o remanescente de 26h (74-48) entra como bloco2 parcial --
// esse SIM e novo (a priorExcess nunca tinha chegado a fechar o bloco2).
const rB2=computeDL119(224, dctx, new Set(), {priorHours:200, isLastBlock:true});
assertEqual(rB2.blocks.length, 1, 'caso B com isLastBlock: so o bloco2 parcial e novo');
assertEqual(rB2.blocks[0].hours, 26, 'caso B bloco2 parcial tem 26h');

console.log('OK: computeDL119() incremental (blocos delta entre periodos, bloco final proporcional Art.4o/4) — '+CHECKS_RUN+' assercoes.');
`);
