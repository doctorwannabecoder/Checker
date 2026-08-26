const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Output 3 e uma ESTIMATIVA ANUAL: extrapola o extra ER+TN x12/n. A base tem
   de ser anualizada da mesma maneira (14x o vencimento mensal = 12 meses +
   subsidios de ferias e Natal), senao o cartao somava 1 mes de base com 12
   meses de extra e chamava "TOTAL ANUAL" ao resultado. */
document.getElementById('selCategory').value='assistente';
fillRegimeOptions();
document.getElementById('selRegime').value='geral';
document.getElementById('selStartYear').value='2026';

function baseCellOf(html){
  // 1a linha da tabela = "Vencimento base + subsidios"; 3a celula = valor
  const row=html.slice(0, html.indexOf('</tr>'));
  const cells=[...row.matchAll(/<td[^>]*>([\\s\\S]*?)<\\/td>/g)].map(m=>m[1].replace(/<[^>]*>/g,'').trim());
  return cells[cells.length-1];
}

// --- Periodo PARCIAL (1 mes): a base tem de vir anualizada a 14x ---
setPeriod(5,1);
const mb=currentMonthlyBase();
renderAnnual({totalExtraEur:1000, totalErHours:0}, null, null);
let html=document.querySelector('#annualTable tbody').innerHTML;
assertEqual(baseCellOf(html), eur(round2(mb*14)),
  '1 mes: base do Output 3 = 14x vencimento mensal (nao 1x)');
assertEqual(html.includes('anualizado'), true, '1 mes: a linha e assinalada como anualizada');
assertEqual(html.includes('12 meses + férias + Natal'), true, '1 mes: mostra o calculo x14');

// o total tem de ser base anualizada + extra extrapolado, nao uma mistura
const totalHtml=document.querySelector('#annualTable tfoot').innerHTML;
assertEqual(totalHtml.includes(eur(round2(mb*14+1000*12))), true,
  '1 mes: TOTAL ANUAL = base x14 + extra x12');

// --- Meio ano: mesma regra, o extra e que muda ---
setPeriod(1,6);
renderAnnual({totalExtraEur:600, totalErHours:0}, null, null);
html=document.querySelector('#annualTable tbody').innerHTML;
assertEqual(baseCellOf(html), eur(round2(mb*14)), '6 meses: base continua 14x');

// --- Ano civil completo: soma real, que ja da 14x ---
setPeriod(1,12);
const pb=periodBaseWithSubsidios();
assertClose(pb.total, round2(mb*14), 0.02, 'ano completo: a soma real ja e 14x');
renderAnnual({totalExtraEur:1200, totalErHours:0}, null, null);
html=document.querySelector('#annualTable tbody').innerHTML;
assertEqual(baseCellOf(html), eur(pb.total), 'ano completo: usa a soma real do periodo');
assertEqual(html.includes('12 meses inseridos'), true, 'ano completo: assinalado como dados inseridos');
assertEqual(html.includes('anualizado'), false, 'ano completo: NAO diz anualizado');

// --- Dedicacao Plena: o suplemento acompanha a base anualizada ---
document.getElementById('selRegime').value='plena';
setPeriod(5,1);
const mbP=currentMonthlyBase();
renderAnnual({totalExtraEur:0, totalErHours:0}, null, null);
html=document.querySelector('#annualTable tbody').innerHTML;
assertEqual(baseCellOf(html), eur(round2(mbP*14)), 'Plena/1 mes: base anualizada 14x');
assertEqual(html.includes('suplemento Dedicação Plena'), true, 'Plena: linha do suplemento presente');
// o suplemento e 20% do montante ja anualizado (25% sobre o ordenado base)
assertEqual(html.includes(eur(round2(round2(mbP*14)*0.2))), true,
  'Plena: suplemento = 20% da base ANUALIZADA (nao de 1 mes)');

console.log('OK: Output 3 anualiza a base (14x) em periodos parciais — '+CHECKS_RUN+' assercoes.');
`);
