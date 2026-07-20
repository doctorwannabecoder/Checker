const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
// Internato Medico Anos 4-6 (ife2): as horas Extra (E) sao pagas a 80% do
// valor/hora do Assistente em regime Geral, nao ao valor/hora do proprio
// internato -- afeta erHourly() (usado por ER e TN), NAO currentHourly()
// (vencimento base normal).
document.getElementById('selCategory').value='ife2';
document.getElementById('selRegime').value='geral';
assertClose(currentHourly(), 14.52, 'ife2: vencimento base normal, NAO afetado');
assertClose(erHourly(), round2(20.42*0.8), 'ife2: erHourly() = 80% do Assistente/Geral (20.42)');

// Outras categorias nao afetadas
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
assertEqual(erHourly(), currentHourly(), 'Assistente/Geral: erHourly()==currentHourly()');
document.getElementById('selCategory').value='ife1';
assertEqual(erHourly(), currentHourly(), 'Internato Anos 1-3 (ife1): NAO afetado, erHourly()==currentHourly()');

// Confirma no calculo real de um turno ER (banco noite) que o valor-hora
// implicito e o de erHourly() (80% Assistente/Geral), nao o do proprio internato.
document.getElementById('selCategory').value='ife2';
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
const target=UI.manualRows.find(r=>r.inMonth && parseISO(r.date).getDay()>=1 && parseISO(r.date).getDay()<=5);
target.banco='noite';
calculate();
const erRow=UI.lastResult.summary.find(r=>r.isER);
const impliedRate=round2(erRow.eur/erRow.hours/erRow.mult);
assertClose(impliedRate, round2(20.42*0.8), 'ife2: valor-hora implicito no turno real = 80% Assistente/Geral (16.34), NAO 14.52');

console.log('OK: erHourly() Internato Medico Anos 4-6 (ife2 = 80% Assistente/Geral) — '+CHECKS_RUN+' assercoes.');
`);
