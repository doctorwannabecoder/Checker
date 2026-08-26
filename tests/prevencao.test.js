const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Prevencao (P): so ao fim de semana, ocupa a janela da noite (20:00-08:00) e
   e paga a METADE do valor/hora do turno que cobriria essas horas. */
const R=20;
const ectx={dailyContractHours:8, weeklyContract:40, hourly:R, initialDeficit:0, regime:'geral'};

/* 2026-05-02 = Sabado. 20:00-08:00 = 12h, todas noturnas:
     Sab 20:00-21:00 -> SAB|not|first  x2.25   ( 1h)
     Sab 21:00-24:00 -> SAB|not|seg    x2.5    ( 3h)
     Dom 00:00-08:00 -> DOM|not|seg    x2.5    ( 8h)
   soma dos multiplicadores = 2.25 + 7.5 + 20 = 29.75 */
const MULT_SUM=29.75;
const prevEntry={date:'2026-05-02', inMonth:true, regularHours:0, er:false, prevention:true,
                 start:'20:00', end:'08:00', workType:'', bancoType:''};
const res=computeMonth([prevEntry], ectx);
const prevRow=res.summary.find(r=>r.key==='PREV');

assert(!!prevRow, 'Output 1 tem a linha PREV');
assertClose(prevRow.hours, 12, 0.01, 'Prevencao: 12 horas');
assertClose(prevRow.eur, R*MULT_SUM*0.5, 0.01, 'Prevencao: metade do valor/hora do turno');

// Disponibilidade, nao trabalho efetivo: nao gera ER nem TN.
assertEqual(res.totalErHours, 0, 'Prevencao nao conta como horas ER (limite anual DL119)');
assertEqual(res.summary.some(r=>r.isER&&r.hours>0), false, 'Prevencao nao gera linhas ER');
assertEqual(res.summary.some(r=>r.isTN&&r.hours>0), false, 'Prevencao nao gera TN');

// Exatamente 50% do turno ER equivalente (sem contrato por cumprir, para que
// nenhuma hora seja absorvida como contrato/TN).
const erEntry={date:'2026-05-02', inMonth:true, regularHours:0, er:true,
               start:'20:00', end:'08:00', workType:'', bancoType:'noite'};
const resEr=computeMonth([erEntry], {dailyContractHours:0, weeklyContract:0, hourly:R,
                                     initialDeficit:0, regime:'geral'});
const erEur=resEr.summary.filter(r=>r.isER).reduce((a,r)=>a+r.eur,0);
assertClose(prevRow.eur, erEur*0.5, 0.01, 'Prevencao = 50% do turno ER equivalente');

/* --- UI: o botao P so existe ao fim de semana --- */
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
renderManualCalendar();
const html=document.getElementById('manualCal').innerHTML;

// cada dia tem 2 blocos data-d: o 1o e work-toggles, o 2o e banco-toggles
function bancoBlock(date){
  const first=html.indexOf('data-d="'+date+'"');
  const second=html.indexOf('data-d="'+date+'"', first+1);
  return html.slice(second, html.indexOf('</div>', second));
}
assertEqual(bancoBlock('2026-05-02').includes('banco-p'), true,  'Sabado: botao P presente');
assertEqual(bancoBlock('2026-05-03').includes('banco-p'), true,  'Domingo: botao P presente');
assertEqual(bancoBlock('2026-05-04').includes('banco-p'), false, 'Segunda (dia util): sem botao P');

/* --- collectEntries: P so ao fim de semana e so sem turno de banco --- */
const sat=UI.rowByDate['2026-05-02'];
sat.prev=true; sat.banco='';
let e=collectEntries().find(x=>x.date==='2026-05-02');
assertEqual(e.prevention, true, 'Sabado com P: prevention=true');
assertEqual(e.start+'-'+e.end, '20:00-08:00', 'Prevencao ocupa a janela da noite');

sat.banco='noite';
e=collectEntries().find(x=>x.date==='2026-05-02');
assertEqual(e.prevention, false, 'P ignorada quando ha turno de banco no mesmo dia (exclusivas)');
sat.banco=''; sat.prev=false;

const mon=UI.rowByDate['2026-05-04'];
mon.prev=true;
e=collectEntries().find(x=>x.date==='2026-05-04');
assertEqual(!e || e.prevention===false, true, 'P num dia util e ignorada');
mon.prev=false;

console.log('OK: Prevencao (P) -- so fim de semana, janela da noite, metade do valor do turno — '+CHECKS_RUN+' assercoes.');
`);
