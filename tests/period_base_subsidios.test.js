const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Subsidios de ferias e de Natal: cada um vale UM VENCIMENTO BASE INTEIRO, pago
   no mes em que cai (Junho / Dezembro). NAO sao proporcionais aos meses que
   estao inseridos na ferramenta — o recibo de Junho traz o subsidio inteiro
   mesmo que so se tenha inserido esse mes, e e o recibo que se quer conferir. */
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
document.getElementById('selStartYear').value='2026';

// Caso 1: mes normal (Maio) -- sem subsidios
setPeriod(5,1);
let pb=periodBaseWithSubsidios();
assertEqual(pb.n, 1, 'Maio: n=1');
assertEqual(pb.total, pb.monthlyBase, 'Maio: total = 1x vencimento (sem subsidio)');
assertEqual(pb.subJune, 0, 'Maio: sem subsidio de ferias');
assertEqual(pb.subDec, 0, 'Maio: sem subsidio de Natal');

// Caso 2: Junho sozinho -- subsidio de ferias INTEIRO
setPeriod(6,1);
pb=periodBaseWithSubsidios();
assertEqual(pb.hasJune, true, 'Junho: o mes esta no periodo');
assertClose(pb.subJune, pb.monthlyBase, 'Junho: subsidio de ferias = 1 vencimento inteiro');
assertEqual(pb.subDec, 0, 'Junho: sem subsidio de Natal');
assertClose(pb.total, round2(pb.monthlyBase*2), 'Junho sozinho: total = 2x vencimento');

// Caso 3: Dezembro sozinho -- subsidio de Natal INTEIRO
setPeriod(12,1);
pb=periodBaseWithSubsidios();
assertEqual(pb.hasDecember, true, 'Dezembro: o mes esta no periodo');
assertClose(pb.subDec, pb.monthlyBase, 'Dezembro: subsidio de Natal = 1 vencimento inteiro');
assertEqual(pb.subJune, 0, 'Dezembro: sem subsidio de ferias');
assertClose(pb.total, round2(pb.monthlyBase*2), 'Dezembro sozinho: total = 2x vencimento');

// Caso 4: ano civil completo -- 12 meses + os 2 subsidios = 14x
setPeriod(1,12);
pb=periodBaseWithSubsidios();
assertEqual(pb.n, 12, 'Ano completo: n=12');
assertClose(pb.subJune, pb.monthlyBase, 'Ano completo: subsidio de ferias = 1 vencimento');
assertClose(pb.subDec, pb.monthlyBase, 'Ano completo: subsidio de Natal = 1 vencimento');
assertClose(pb.total, round2(pb.monthlyBase*14), 'Ano completo: total = 14x vencimento');

// Caso 5: Mar-Ago -- apanha Junho, nao apanha Dezembro
setPeriod(3,6);
pb=periodBaseWithSubsidios();
assertEqual(pb.n, 6, 'Mar-Ago: n=6');
assertEqual(pb.hasDecember, false, 'Mar-Ago: Dezembro fora do periodo');
assertClose(pb.subJune, pb.monthlyBase, 'Mar-Ago: subsidio de ferias inteiro (nao 4/6)');
assertEqual(pb.subDec, 0, 'Mar-Ago: sem subsidio de Natal');
assertClose(pb.total, round2(pb.monthlyBase*7), 'Mar-Ago: total = 6 meses + 1 subsidio');

// Caso 6: Abr-Jun -- 3 meses, subsidio na mesma inteiro (antes dava metade)
setPeriod(4,3);
pb=periodBaseWithSubsidios();
assertEqual(pb.n, 3, 'Abr-Jun: n=3');
assertClose(pb.subJune, pb.monthlyBase, 'Abr-Jun: subsidio inteiro, nao metade');
assertClose(pb.total, round2(pb.monthlyBase*4), 'Abr-Jun: total = 3 meses + 1 subsidio');

// Caso 7: o suplemento de Dedicacao Plena acompanha (a tabela SIM ja o inclui
// no vencimento do regime, e os subsidios sao vencimentos base)
setPeriod(1,12);
document.getElementById('selRegime').value='plena';
const pbPlena=periodBaseWithSubsidios();
const supPlena=plenaSupplementOf(pbPlena.total);
document.getElementById('selRegime').value='geral';
const pbGeral=periodBaseWithSubsidios();
assertEqual(plenaSupplementOf(pbGeral.total), 0, 'Geral: sem suplemento Plena');
assertEqual(supPlena>0, true, 'Plena: suplemento > 0');
assertEqual(pbPlena.total>pbGeral.total, true, 'Plena: total maior que Geral');
assertClose(pbPlena.total, round2(pbPlena.monthlyBase*14), 'Plena: tambem 14x o seu vencimento');

// baseForMonths() aceita qualquer lista (usado pelo historico)
assertClose(baseForMonths([{y:2026,m:6}]).total, round2(pbGeral.monthlyBase*2),
  'baseForMonths([Junho]) = 2x vencimento');
assertClose(baseForMonths([{y:2026,m:5}]).total, pbGeral.monthlyBase,
  'baseForMonths([Maio]) = 1x vencimento');

console.log('OK: subsidios de ferias/Natal pagos por inteiro no mes em que caem — '+CHECKS_RUN+' assercoes.');
`);
