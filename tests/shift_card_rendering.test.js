const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
const R=20.42;
const entriesA=[
  {date:'2026-05-04', inMonth:true, regularHours:7, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-05', inMonth:true, regularHours:7, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-06', inMonth:true, regularHours:7, er:false, start:'', end:'', workType:'rotina', bancoType:''},
  {date:'2026-05-07', inMonth:true, regularHours:7, er:true, start:'20:00', end:'08:00', workType:'rotina', bancoType:'noite'},
  {date:'2026-05-08', inMonth:true, regularHours:7, er:false, start:'', end:'', workType:'rotina', bancoType:''},
];
const ectxA={dailyContractHours:8, weeklyContract:40, hourly:R, initialDeficit:0, regime:'geral'};
const resA=computeMonth(entriesA, ectxA);
renderShifts(resA.shifts.filter(s=>s.isER));
const html=document.getElementById('shiftsArea').innerHTML;

assertEqual(html.includes('>Base<'), false, 'Output 2 (por turno) nao mostra a categoria Base');
assertEqual(html.includes('cio:'), false, 'Output 2 nao mostra "Inicio:" (removido, formato simplificado)');
assertEqual(html.includes('Horas totais:'), false, 'Output 2 nao mostra "Horas totais:" (removido)');
assertEqual(html.includes('TN'), true, 'Output 2 mostra o suplemento TN do turno noturno');

console.log('OK: renderShifts() (Output 2, detalhe por turno ER) — '+CHECKS_RUN+' assercoes.');
`);
