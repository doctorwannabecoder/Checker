const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
// Esta ferramenta deliberadamente NAO avalia tetos diarios/semanais de horas
// (pedido explicito do utilizador) -- confirma que nenhum aviso desse tipo e
// gerado e que 'overLimit' nao existe em weeklyStats.
const R=20.42;
const entriesA=[
  {date:'2026-05-04', inMonth:true, regularHours:8, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-05', inMonth:true, regularHours:8, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-06', inMonth:true, regularHours:8, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-07', inMonth:true, regularHours:8, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-08', inMonth:true, regularHours:8, er:true, start:'08:00', end:'08:00', workType:'rotina', bancoType:'h24'},
];
const ectx={dailyContractHours:8, weeklyContract:40, hourly:R, initialDeficit:0, regime:'geral'};
const resA=computeMonth(entriesA, ectx);
assertEqual(resA.weeklyStats[0].workedH>48, true, 'semana bem acima de 48h (sem teto a impedir)');
assertEqual(resA.warnings.some(w=>/teto|m.ximo di.rio/i.test(w.msg)), false, 'nenhum aviso de teto diario/semanal gerado');
assertEqual('overLimit' in resA.weeklyStats[0], false, 'weeklyStats nao tem o campo overLimit (removido)');

// turno individual de 30h (alem do antigo limite de 24h) tambem sem aviso
const entriesB=[{date:'2026-05-11', inMonth:true, regularHours:0, er:true, start:'02:00', end:'08:00', hours:30, workType:'', bancoType:'noite'}];
const resB=computeMonth(entriesB, ectx);
assertEqual(resB.warnings.length, 0, 'turno de 30h nao gera avisos de duracao');

// --- Urgencia (banco) ignora o trabalho normal do MESMO dia ---
// NOTA: o mock de <select> nao interpreta "<option selected>" do innerHTML
// (ao contrario de um browser real) -- por isso os campos de horas por tipo
// de trabalho tem de ser definidos explicitamente aqui.
document.getElementById('selRotinaH').value='7';
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
const target=UI.manualRows.find(r=>r.inMonth && parseISO(r.date).getDay()>=1 && parseISO(r.date).getDay()<=5);

target.work='rotina'; target.banco='dia';
let e=collectEntries().find(x=>x.date===target.date);
assertEqual(e.regularHours, 0, 'Urgencia D ignora o trabalho normal do mesmo dia (0h, apesar de work=rotina)');
assertEqual(e.workType, '', 'Urgencia D: workType fica vazio');
assertEqual(e.er, true, 'Urgencia D: er=true');
assertEqual(e.start, '08:00', 'Urgencia D: inicio 08:00');
assertEqual(e.end, '20:00', 'Urgencia D: fim 20:00');

target.banco='noite';
e=collectEntries().find(x=>x.date===target.date);
assertEqual(e.regularHours>0, true, 'Urgencia N sozinha NAO ignora o trabalho normal (continua a somar)');
assertEqual(e.workType, 'rotina', 'Urgencia N sozinha: workType continua rotina');

target.banco='h24';
e=collectEntries().find(x=>x.date===target.date);
assertEqual(e.regularHours, 0, 'Urgencia 24h (D+N) tambem ignora o trabalho normal');

console.log('OK: sem tetos diarios/semanais + Urgencia D/24h ignora trabalho normal (N sozinha nao ignora) — '+CHECKS_RUN+' assercoes.');
`);
