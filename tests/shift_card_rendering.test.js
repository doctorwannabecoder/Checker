const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Output 2: uma tabela por turno, repartida por DIA. Um turno noturno que
   atravessa a meia-noite aparece com as horas separadas entre os dois dias. */
const R=20;

/* --- Exemplo: noite de 5-6 de Maio de 2026 (Ter->Qua), sem contrato por
   cumprir, portanto sem TN -- tudo extraordinario:
     dia 5  20:00-21:00  DU · Not · 1ª    1h   (x1.75)
     dia 5  21:00-24:00  DU · Not · Seg   3h   (x2.0)
     dia 6  00:00-08:00  DU · Not · Seg   8h   (x2.0)  */
const entries=[{date:'2026-05-05', inMonth:true, regularHours:0, er:true,
                start:'20:00', end:'08:00', workType:'', bancoType:'noite'}];
const res=computeMonth(entries, {dailyContractHours:0, weeklyContract:0, hourly:R,
                                 initialDeficit:0, regime:'geral'});
const shift=res.shifts.find(s=>s.date==='2026-05-05');

assertEqual(shift.endDate, '2026-05-06', 'turno noturno termina no dia seguinte');
assertEqual(shift.days.length, 2, 'turno repartido por 2 dias');
assertEqual(shift.days[0].date, '2026-05-05', 'primeiro dia = 5 de Maio');
assertEqual(shift.days[1].date, '2026-05-06', 'segundo dia = 6 de Maio');

const d5=shift.days[0].allocations, d6=shift.days[1].allocations;
const find=(arr,code)=>arr.find(a=>a.code===code);
assertClose(find(d5,'DU · Not · 1ª').hours, 1, 0.01, 'dia 5: 1ª hora = 1h');
assertClose(find(d5,'DU · Not · Seg').hours, 3, 0.01, 'dia 5: seguintes = 3h');
assertClose(find(d6,'DU · Not · Seg').hours, 8, 0.01, 'dia 6: seguintes = 8h');
assertEqual(d6.some(a=>a.code==='DU · Not · 1ª'), false, 'dia 6 nao repete a 1ª hora');

// a repartição por dia tem de bater certo com os totais agregados do turno
const somaDias=shift.days.reduce((t,d)=>t+d.allocations.reduce((x,a)=>x+a.hours,0),0);
assertClose(somaDias, shift.totalH, 0.01, 'soma das horas por dia = total do turno');
const somaEur=shift.days.reduce((t,d)=>t+d.allocations.reduce((x,a)=>x+a.eur,0),0);
assertClose(somaEur, shift.shiftEur, 0.02, 'soma dos valores por dia = valor do turno');

/* --- TN: com contrato por cumprir, parte da noite vira suplemento noturno,
   e tambem tem de aparecer repartido por dia --- */
const resTN=computeMonth([{date:'2026-05-05', inMonth:true, regularHours:0, er:true,
                           start:'20:00', end:'08:00', workType:'', bancoType:'noite'}],
                         {dailyContractHours:8, weeklyContract:40, hourly:R,
                          initialDeficit:0, regime:'geral'});
const sTN=resTN.shifts.find(s=>s.date==='2026-05-05');
const allTN=sTN.days.reduce((a,d)=>a.concat(d.allocations),[]);
assertEqual(allTN.some(a=>a.isTN), true, 'com contrato por cumprir aparece TN na repartição por dia');
assertClose(allTN.filter(a=>a.isTN).reduce((t,a)=>t+a.hours,0), sTN.tnH, 0.01,
  'horas TN por dia = tnH do turno');

/* --- Render --- */
renderShifts(res.shifts.filter(s=>s.isER));
const html=document.getElementById('shiftsArea').innerHTML;

assertEqual(html.includes('<table id="shiftsTable"'), true, 'Output 2 e uma tabela');
assertEqual(html.includes('Descrição · coeficiente'), true, 'coluna comum com descricao e coeficiente');
assertEqual(html.includes('×2'), true, 'mostra o coeficiente na coluna comum');
assertEqual(html.includes('rowspan'), true, 'a coluna do turno agrupa as linhas do turno');
assertEqual(html.includes('Total do turno'), true, 'linha de total do turno');
assertEqual(html.includes('>Base<'), false, 'Output 2 nao mostra a categoria Base');
assertEqual(html.includes('Copiar'), false, 'botao Copiar removido');
// intervalo de datas num turno que atravessa a meia-noite
assertEqual(html.includes('5–06/05/2026'), true, 'turno noturno mostra intervalo entre os 2 dias');

console.log('OK: Output 2 -- tabela de horas por turno, repartida por dia — '+CHECKS_RUN+' assercoes.');
`);
