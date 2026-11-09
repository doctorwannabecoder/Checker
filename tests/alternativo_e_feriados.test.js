const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Alternativo (A): comeca as 08:00 e e sempre extra, mesmo que a semana nao
   complete o contrato. Feriados: mesmas opcoes do fim de semana (A, D, N, P);
   em dia util abatem 8h ao contrato e o turno escolhido e todo extra. */
const R=20;
const ectx={dailyContractHours:8, weeklyContract:40, hourly:R, initialDeficit:0, regime:'geral'};
const hoursOf=(res,key)=>{ const r=res.summary.find(x=>x.key===key); return r?r.hours:0; };
const blank={inMonth:true, regularHours:0, alternativeHours:0, er:false, prevention:false,
             start:'', end:'', workType:'', bancoType:''};

/* --- A de 8h ao Sabado (2026-05-02): 08:00-16:00, reparte as 13:00 ---
     08-09 DU diu 1a x1.25 | 09-13 DU diu seg x1.5 | 13-16 SAB diu seg x2.0 */
let res=computeMonth([Object.assign({},blank,{date:'2026-05-02',alternativeHours:8,workType:'extra'})], ectx);
assertClose(hoursOf(res,'ER_DU_DIU_1'), 1, 0.001, 'A 8h Sab: 1h a 1a hora de dia util');
assertClose(hoursOf(res,'ER_DU_DIU_S'), 4, 0.001, 'A 8h Sab: 4h seguintes de dia util (ate as 13:00)');
assertClose(hoursOf(res,'ER_SAB_DIU_S'), 3, 0.001, 'A 8h Sab: 3h depois das 13:00');
assertClose(res.erEur, R*(1.25+6+6), 0.001, 'A 8h Sab: valor pelos multiplicadores de extra');
assertEqual(res.summary.some(x=>x.key==='RW'), false, 'A nao gera linha de Base');
assertClose(res.totalErHours, 8, 0.001, 'A conta como horas extra');
assertClose(res.weeklyStats[0].workedH, 8, 0.001, 'A conta como horas trabalhadas');
assertClose(res.weeklyStats[0].deficitOut, 40, 0.001, 'A nao preenche o contrato, mesmo em semana incompleta');
assertEqual(res.shifts[0].altStart+'-'+res.shifts[0].altEnd, '08:00-16:00', 'janela do A para o Output 2');
assertClose(res.weeklyStats[0].weekendBancoH, 0, 0.001, 'A nao conta como banco de fim de semana (Art.5)');

/* --- Domingo: tudo a tarifa de Domingo --- */
res=computeMonth([Object.assign({},blank,{date:'2026-05-03',alternativeHours:4,workType:'extra'})], ectx);
assertClose(res.erEur, R*(1.75+6), 0.001, 'A 4h Domingo: 1a hora x1.75 + 3h x2.0');

/* --- A nao altera o espaco de contrato que o banco preenche --- */
const dia={date:'2026-05-04', regularHours:0, er:true, start:'08:00', end:'20:00', bancoType:'dia'};
const semA=computeMonth([Object.assign({},blank,dia)], ectx);
const comA=computeMonth([Object.assign({},blank,dia),
  Object.assign({},blank,{date:'2026-05-02',alternativeHours:4,workType:'extra'})], ectx);
assertClose(comA.shifts.find(s=>s.date==='2026-05-04').contractDayH,
            semA.shifts.find(s=>s.date==='2026-05-04').contractDayH, 0.001,
            'o banco da semana continua a preencher o mesmo contrato com A presente');

/* --- UI: feriado em dia util (2026-06-10, Quarta) --- */
document.getElementById('selRotinaH').value='7';
document.getElementById('selExtraH').value='4';
document.getElementById('selStartMonth').value='6';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
const H='2026-06-10', W='2026-06-11';
const entryOf=d=>collectEntries().find(x=>x.date===d);
assertEqual(dayKind(H), 'holiday', '10 de Junho e feriado');
assertEqual(UI.rowByDate[H].work, '', 'feriado em dia util: sem prefill');
assertEqual(allowedWorkTypes(H).join(','), 'extra', 'feriado: so A no trabalho normal');
assertEqual(allowedWorkTypes(W).includes('extra'), false, 'dia util normal: sem A');
assertClose(entryOf(H).regularHours, 8, 0.001, 'feriado vazio em dia util: conta 8h');

// F guardado antes desta regra: nao duplica nem gera outro tipo
UI.rowByDate[H].work='folga';
assertClose(entryOf(H).regularHours, 8, 0.001, 'Folga antiga num feriado: continua 8h');
UI.rowByDate[H].work='extra';
assertClose(entryOf(H).regularHours, 8, 0.001, 'A em feriado: mantem as 8h de contrato');
assertClose(entryOf(H).alternativeHours, 4, 0.001, 'A em feriado: 4h de extra por cima');
res=computeMonth([entryOf(H)], ectx);
assertClose(res.erEur, R*(1.75+6), 0.001, 'A em feriado: tarifa de feriado');
UI.rowByDate[H].work='';

/* --- D em feriado: 8h mantem-se e o turno e todo extra --- */
UI.rowByDate[H].banco='dia';
const eD=entryOf(H);
assertClose(eD.regularHours, 8, 0.001, 'D em feriado: mantem as 8h');
res=computeMonth([eD], ectx);
assertClose(res.shifts[0].contractDayH, 0, 0.001, 'D em feriado: nada vai para contrato');
assertClose(res.erEur, R*(1.75+22), 0.001, 'D em feriado: 12h a tarifa de extra');
assertEqual(res.warnings.length, 0, 'D em feriado: sem aviso de sobreposicao');
assertClose(res.weeklyStats[0].deficitOut, 32, 0.001, 'D em feriado: so as 8h abatem ao contrato');

/* --- N em feriado: toda extra, sem TN --- */
UI.rowByDate[H].banco='noite';
res=computeMonth([entryOf(H)], ectx);
assertClose(res.summary.filter(x=>x.isTN).reduce((s,x)=>s+x.hours,0), 0, 0.001, 'N em feriado: sem TN');
assertClose(res.totalErHours, 12, 0.001, 'N em feriado: 12h extra');

/* --- P em feriado sim, em dia util normal nao --- */
UI.rowByDate[H].banco=''; UI.rowByDate[H].prev=true;
assertEqual(entryOf(H).prevention, true, 'P aceite em feriado em dia util');
assertClose(entryOf(H).regularHours, 8, 0.001, 'P em feriado: mantem as 8h');
UI.rowByDate[W].prev=true;
assertEqual(entryOf(W).prevention, false, 'P ignorada em dia util normal');
UI.rowByDate[H].prev=false; UI.rowByDate[W].prev=false;

/* --- Feriado ao Sabado (2026-08-15): sem as 8h, como fim de semana --- */
document.getElementById('selStartMonth').value='8';
updatePeriodAvailability();
buildCalendar();
assertEqual(parseISO('2026-08-15').getDay(), 6, '15 de Agosto de 2026 e Sabado');
assertEqual(isHoliday('2026-08-15'), true, '15 de Agosto e feriado');
assertEqual(entryOf('2026-08-15'), undefined, 'feriado ao Sabado vazio: nao conta');

console.log('OK: A sempre extra + feriados com opcoes de fim de semana — '+CHECKS_RUN+' assercoes.');
`);
