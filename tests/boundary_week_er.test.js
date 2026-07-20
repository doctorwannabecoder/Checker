const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
// Maio 2026 comeca numa Sexta (01/05). A 1a semana renderizada vai de
// 27/04 (Seg, mes anterior) a 03/05 (Dom). Marca banco noite no dia de
// FRONTEIRA (27/04, fora do mes) e confirma que conta para o contrato da
// semana mas NAO aparece nos outputs do mes.
const R=20.42;
const entries=[
  {date:'2026-04-27', inMonth:false, regularHours:0, er:true, start:'20:00', end:'08:00', workType:'', bancoType:'noite'},
  {date:'2026-05-01', inMonth:true, regularHours:7, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-02', inMonth:true, regularHours:7, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-03', inMonth:true, regularHours:7, er:false, start:'', end:'', workType:'rotina', bancoType:''},
];
const ectx={dailyContractHours:8, weeklyContract:40, hourly:R, initialDeficit:0, regime:'geral'};
const res=computeMonth(entries, ectx);
const wk=res.weeklyStats[0];

assertEqual(wk.workedH>=12, true, 'semana inclui as 12h do turno de fronteira no total trabalhado');
assertEqual((wk.erH+wk.tnH)>0, true, 'semana reflete ER/TN gerados pelo turno de fronteira');
assertEqual(res.shifts.some(s=>s.date==='2026-04-27'), false, 'Output 2 (shifts) NAO inclui a data de fronteira');
assertEqual(res.summary.some(r=>(r.isER||r.isTN)&&r.hours>0), false, 'Output 1 (summary) sem ER/TN -- so vieram da fronteira');
assertEqual(res.totalErHours, 0, 'totalErHours (usado no limite anual DL119) nao conta a fronteira');
assertEqual(res.erEur, 0, 'erEur nao conta a fronteira');
assertEqual(res.tnEur, 0, 'tnEur nao conta a fronteira');
// o turno de fronteira consumiu espaco de contrato -- deficit da semana baixo
// mesmo so havendo 21h de rotina "dentro do mes" (21h+12h=33h de 40h contrato)
assertEqual(wk.deficitOut<=10, true, 'turno de fronteira consumiu espaco de contrato (deficit baixo)');

console.log('OK: computeMonth() com turno de fronteira (semana anterior ao 1o dia do mes) — '+CHECKS_RUN+' assercoes.');
`);
