const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Periodo = mes inicial + nº de meses, com um teto que impede o periodo de
   atravessar para Janeiro do ano seguinte. Nao ha modos Mensal/Anual/Variavel. */
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
document.getElementById('selStartYear').value='2026';

// --- 1 mes (defeito) ---
setPeriod(5,1);
assertEqual(numMeses(), 1, '1 mes: numMeses()=1');
assertEqual(isFullYear(), false, '1 mes: nao e ano completo');
const mayRows=UI.manualRows.filter(r=>r.inMonth);
const hasWeekendBlank=mayRows.some(r=>{const dow=parseISO(r.date).getDay(); return (dow===0||dow===6)&&r.work==='';});
assertEqual(hasWeekendBlank, true, '1 mes: fim de semana sem prefill automatico');

// --- Janeiro + 12 meses = ano civil completo ---
setPeriod(1,12);
assertEqual(numMeses(), 12, 'Jan+12: numMeses()=12');
assertEqual(isFullYear(), true, 'Jan+12: isFullYear()');
assertEqual(UI.periodRanges.length, 12, 'Jan+12: 12 meses em periodRanges');
assertEqual(UI.periodRanges[0].firstISO, '2026-01-01', 'Jan+12: comeca a 1 de Janeiro');
assertEqual(UI.periodRanges[11].lastISO, '2026-12-31', 'Jan+12: termina a 31 de Dezembro');
const anualRows=UI.manualRows.filter(r=>r.inMonth);
assertEqual(anualRows.length, 365, 'Jan+12 em 2026 (nao bissexto): 365 dias');
// prefill: dia util sem feriado=Rotina; feriado em dia util=Folga; fim de semana=vazio
const weekdayNonHoliday=anualRows.filter(r=>dayKind(r.date)==='weekday');
assertEqual(weekdayNonHoliday.every(r=>r.work==='rotina'), true, 'dias uteis sem feriado -> Rotina');
const weekdayHoliday=anualRows.filter(r=>{const dow=parseISO(r.date).getDay(); return dayKind(r.date)==='holiday'&&dow!==0&&dow!==6;});
assertEqual(weekdayHoliday.every(r=>r.work==='folga'), true, 'feriados em dia util -> Folga');
const anyWeekend=anualRows.filter(r=>{const dow=parseISO(r.date).getDay(); return dow===0||dow===6;});
assertEqual(anyWeekend.every(r=>r.work===''), true, 'qualquer fim de semana (mesmo feriado) -> sem prefill');

// --- Periodo parcial de varios meses ---
setPeriod(3,5);
assertEqual(numMeses(), 5, 'Mar+5: 5 meses');
assertEqual(isFullYear(), false, 'Mar+5: nao e ano completo');
assertEqual(UI.periodRanges[0].m, 3, 'Mar+5: primeiro mes = Marco');
assertEqual(UI.periodRanges[4].m, 7, 'Mar+5: ultimo mes = Julho');
const varRows=UI.manualRows.filter(r=>r.inMonth);
assertEqual(varRows.filter(r=>dayKind(r.date)==='weekday').every(r=>r.work==='rotina'), true,
  'periodo parcial: mesmo prefill (Rotina em dia util)');

// --- Teto: o periodo nunca atravessa para Janeiro do ano seguinte ---
document.getElementById('selStartMonth').value='1';  assertEqual(maxNumMeses(), 12, 'Janeiro: teto 12 meses');
document.getElementById('selStartMonth').value='8';  assertEqual(maxNumMeses(),  5, 'Agosto: teto 5 meses (Ago-Dez)');
document.getElementById('selStartMonth').value='12'; assertEqual(maxNumMeses(),  1, 'Dezembro: teto 1 mes');

// numMeses() nunca devolve mais do que o teto, mesmo com um valor antigo maior
document.getElementById('selStartMonth').value='10';
document.getElementById('selNumMeses').value='12';
assertEqual(numMeses(), 3, 'Outubro com 12 guardado: numMeses() limitado a 3 (Out-Dez)');

// fillNumMesesOptions() corta a escolha atual quando o mes inicial a torna impossivel
setPeriod(1,12);
document.getElementById('selStartMonth').value='9';
fillNumMesesOptions();
assertEqual(document.getElementById('selNumMeses').value, '4', 'Setembro: 12 meses cai para o maximo (4)');
const opts=document.getElementById('selNumMeses').innerHTML;
assertEqual((opts.match(/<option/g)||[]).length, 4, 'Setembro: so 4 opcoes de nº de meses');

// o ultimo mes do periodo e sempre Dezembro ou antes
setPeriod(9,4);
assertEqual(UI.periodRanges[UI.periodRanges.length-1].m, 12, 'Set+4: ultimo mes = Dezembro');
assertEqual(UI.periodRanges.every(r=>r.y===2026), true, 'Set+4: todos os meses no mesmo ano civil');

// --- Voltar a 1 mes ---
setPeriod(5,1);
assertEqual(numMeses(), 1, 'de volta a 1 mes: numMeses()=1');
assertEqual(UI.manualRows.filter(r=>r.inMonth).some(r=>{const dow=parseISO(r.date).getDay(); return (dow===0||dow===6)&&r.work==='';}), true,
  'de volta a 1 mes: fim de semana sem Rotina automatica');

console.log('OK: periodo = mes inicial + nº de meses, com teto ate Dezembro — '+CHECKS_RUN+' assercoes.');
`);
