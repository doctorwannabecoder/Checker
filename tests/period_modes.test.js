const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
document.getElementById('selStartYear').value='2026';

// --- Mensal (defeito) ---
document.getElementById('selStartMonth').value='5';
updatePeriodAvailability();
buildCalendar();
assertEqual(UI.periodMode, 'mensal', 'defeito: periodMode=mensal');
assertEqual(numMeses(), 1, 'mensal: numMeses()=1');
const mayRows=UI.manualRows.filter(r=>r.inMonth);
const hasWeekendBlank=mayRows.some(r=>{const dow=parseISO(r.date).getDay(); return (dow===0||dow===6)&&r.work==='';});
assertEqual(hasWeekendBlank, true, 'mensal: fim de semana sem prefill automatico');

// --- Anual ---
switchPeriodMode('anual');
assertEqual(UI.periodMode, 'anual', 'anual: periodMode=anual');
assertEqual(numMeses(), 12, 'anual: numMeses()=12 (Jan-Dez)');
assertEqual(document.getElementById('selStartMonth').value, '1', 'anual: forca mes inicial=Janeiro');
assertEqual(UI.periodRanges.length, 12, 'anual: 12 meses em periodRanges');
assertEqual(UI.periodRanges[0].firstISO, '2026-01-01', 'anual: comeca a 1 de Janeiro');
assertEqual(UI.periodRanges[11].lastISO, '2026-12-31', 'anual: termina a 31 de Dezembro');
const anualRows=UI.manualRows.filter(r=>r.inMonth);
assertEqual(anualRows.length, 365, 'anual 2026 (nao bissexto): 365 dias');
// prefill: dia util sem feriado=Rotina; feriado em dia util=Folga; qualquer fim de semana (mesmo feriado)=vazio
const weekdayNonHoliday=anualRows.filter(r=>dayKind(r.date)==='weekday');
assertEqual(weekdayNonHoliday.every(r=>r.work==='rotina'), true, 'anual: dias uteis sem feriado -> Rotina');
const weekdayHoliday=anualRows.filter(r=>{const dow=parseISO(r.date).getDay(); return dayKind(r.date)==='holiday'&&dow!==0&&dow!==6;});
assertEqual(weekdayHoliday.every(r=>r.work==='folga'), true, 'anual: feriados em dia util -> Folga');
const anyWeekend=anualRows.filter(r=>{const dow=parseISO(r.date).getDay(); return dow===0||dow===6;});
assertEqual(anyWeekend.every(r=>r.work===''), true, 'anual: qualquer fim de semana (mesmo feriado) -> sem prefill');

// --- Variavel ---
switchPeriodMode('variavel');
document.getElementById('selStartMonth').value='3';
document.getElementById('selEndMonth').value='7';
onStartMonthChange();
assertEqual(UI.periodMode, 'variavel', 'variavel: periodMode=variavel');
assertEqual(numMeses(), 5, 'variavel Mar-Jul: 5 meses');
assertEqual(UI.periodRanges[0].m, 3, 'variavel: primeiro mes = Marco');
assertEqual(UI.periodRanges[4].m, 7, 'variavel: ultimo mes = Julho');
const varRows=UI.manualRows.filter(r=>r.inMonth);
const varWeekdayNonHoliday=varRows.filter(r=>dayKind(r.date)==='weekday');
assertEqual(varWeekdayNonHoliday.every(r=>r.work==='rotina'), true, 'variavel: mesmo prefill que mensal/anual (Rotina em dia util)');

// Mes final nao pode ficar antes do mes inicial (mesmo ano)
document.getElementById('selStartMonth').value='9';
onStartMonthChange();
assertEqual(document.getElementById('selEndMonth').value, '9', 'variavel: mes final e corrigido para nao ficar antes do inicial');

// --- Voltar a Mensal: prefill volta ao normal ---
switchPeriodMode('mensal');
document.getElementById('selStartMonth').value='5';
updatePeriodAvailability();
buildCalendar();
assertEqual(numMeses(), 1, 'de volta a mensal: numMeses()=1');
const backRows=UI.manualRows.filter(r=>r.inMonth);
assertEqual(backRows.some(r=>{const dow=parseISO(r.date).getDay(); return (dow===0||dow===6)&&r.work==='';}), true,
  'de volta a mensal: fim de semana sem Rotina automatica');

console.log('OK: switchPeriodMode()/numMeses()/prefill (mensal, anual, variavel) — '+CHECKS_RUN+' assercoes.');
`);
