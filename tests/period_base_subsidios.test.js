const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
document.getElementById('selStartYear').value='2026';

// Caso 1: Mensal, mes normal (Maio) -- deve ficar IGUAL ao vencimento simples (sem subsidio)
document.getElementById('selStartMonth').value='5';
updatePeriodAvailability();
let pb=periodBaseWithSubsidios();
assertEqual(pb.n, 1, 'Mensal/Maio: n=1');
assertEqual(pb.total, pb.monthlyBase, 'Mensal/Maio: total = 1x vencimento (sem subsidio)');
assertEqual(pb.subJune, 0, 'Mensal/Maio: sem subsidio de ferias');
assertEqual(pb.subDec, 0, 'Mensal/Maio: sem subsidio de Natal');

// Caso 2: Mensal, mes de Junho -- 1/6 de subsidio de ferias SOMA ao total
document.getElementById('selStartMonth').value='6';
updatePeriodAvailability();
pb=periodBaseWithSubsidios();
assertEqual(pb.firstHalf, 1, 'Mensal/Junho: 1 dos 6 meses Jan-Jun presente');
assertClose(pb.subJune, round2(pb.monthlyBase*(1/6)), 'Mensal/Junho: subsidio = 1/6 do vencimento');
assertClose(pb.total, round2(pb.monthlyBase+pb.monthlyBase*(1/6)), 'Mensal/Junho: total inclui o subsidio');

// Caso 3: Mensal, mes de Dezembro -- 1/6 de subsidio de Natal
document.getElementById('selStartMonth').value='12';
updatePeriodAvailability();
pb=periodBaseWithSubsidios();
assertEqual(pb.secondHalf, 1, 'Mensal/Dezembro: 1 dos 6 meses Jul-Dez presente');
assertClose(pb.subDec, round2(pb.monthlyBase*(1/6)), 'Mensal/Dezembro: subsidio = 1/6 do vencimento');

// Caso 4: Anual (12 meses) -- tem de dar EXATAMENTE monthlyBase*14 (formula antiga, flat)
switchPeriodMode('anual');
pb=periodBaseWithSubsidios();
assertEqual(pb.n, 12, 'Anual: n=12');
assertClose(pb.subJune, pb.monthlyBase, 'Anual: subsidio de ferias = 1 mes inteiro (6/6)');
assertClose(pb.subDec, pb.monthlyBase, 'Anual: subsidio de Natal = 1 mes inteiro (6/6)');
assertClose(pb.total, round2(pb.monthlyBase*14), 'Anual: total = monthlyBase x14 exatamente');

// Caso 5: Variavel Mar-Ago (6 meses, inclui Junho mas nao Dezembro)
switchPeriodMode('variavel');
document.getElementById('selStartMonth').value='3';
document.getElementById('selEndMonth').value='8';
onStartMonthChange();
pb=periodBaseWithSubsidios();
assertEqual(pb.n, 6, 'Variavel Mar-Ago: n=6');
assertEqual(pb.firstHalf, 4, 'Variavel Mar-Ago: 4 dos 6 meses Jan-Jun presentes (Mar,Abr,Mai,Jun)');
assertEqual(pb.hasDecember, false, 'Variavel Mar-Ago: Dezembro nao esta no periodo');
assertClose(pb.subJune, round2(pb.monthlyBase*4/6), 'Variavel Mar-Ago: subsidio proporcional a 4/6');
assertEqual(pb.subDec, 0, 'Variavel Mar-Ago: sem subsidio de Natal');

// Caso 6 (exemplo do utilizador): so 3 dos 6 meses Jan-Jun trabalhados -> metade do subsidio
document.getElementById('selStartMonth').value='4';
document.getElementById('selEndMonth').value='6';
onStartMonthChange();
pb=periodBaseWithSubsidios();
assertEqual(pb.firstHalf, 3, 'Variavel Abr-Jun: 3 dos 6 meses Jan-Jun presentes');
assertClose(pb.subJune, round2(pb.monthlyBase*0.5), 'Variavel Abr-Jun: 3/6 = metade do subsidio');

// Caso 7: a correcao aplica-se a QUALQUER regime, nao so Plena
switchPeriodMode('anual');
document.getElementById('selStartMonth').value='1';
document.getElementById('selRegime').value='plena';
const pbPlena=periodBaseWithSubsidios();
const supPlena=plenaSupplementOf(pbPlena.total);
document.getElementById('selRegime').value='geral';
const pbGeral=periodBaseWithSubsidios();
const supGeral=plenaSupplementOf(pbGeral.total);
assertEqual(supGeral, 0, 'Geral: sem suplemento Plena');
assertEqual(supPlena>0, true, 'Plena: suplemento > 0');
assertEqual(pbPlena.total>pbGeral.total, true, 'Plena: total (com suplemento de 25%) e maior que Geral');

console.log('OK: periodBaseWithSubsidios() (mensal/anual/variavel, subsidios de ferias/Natal proporcionais) — '+CHECKS_RUN+' assercoes.');
`);
