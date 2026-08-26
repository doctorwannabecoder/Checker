const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Prevencao (P): so ao fim de semana, janela propria 20:00-08:00
   (PAYROLL_RULES.preventionWindow), paga a METADE do valor/hora do turno que
   cobriria essas horas. Coexiste com Banco Dia; colide com N/24h. */
const R=20;
const ectx={dailyContractHours:8, weeklyContract:40, hourly:R, initialDeficit:0, regime:'geral'};

/* 2026-05-02 = Sabado. A janela 20:00-08:00 sao 12h, todas noturnas:
     Sab 20:00-21:00 -> SAB|not|first  x2.25   ( 1h)
     Sab 21:00-24:00 -> SAB|not|seg    x2.5    ( 3h)
     Dom 00:00-08:00 -> DOM|not|seg    x2.5    ( 8h)
   soma dos multiplicadores = 2.25 + 7.5 + 20 = 29.75 */
const MULT_SUM=29.75;

// --- Prevencao sozinha: sem start/end, a janela vem das regras ---
const prevEntry={date:'2026-05-02', inMonth:true, regularHours:0, er:false, prevention:true,
                 start:'', end:'', workType:'', bancoType:''};
const res=computeMonth([prevEntry], ectx);
const prevRow=res.summary.find(r=>r.key==='PREV');

assert(!!prevRow, 'Output 1 tem a linha PREV');
assertClose(prevRow.hours, 12, 0.01, 'Prevencao: 12 horas');
assertClose(prevRow.eur, R*MULT_SUM*0.5, 0.01, 'Prevencao: metade do valor/hora do turno');

// Disponibilidade, nao trabalho efetivo.
assertEqual(res.totalErHours, 0, 'Prevencao nao conta como horas ER (limite anual DL119)');
assertEqual(res.summary.some(r=>r.isER&&r.hours>0), false, 'Prevencao nao gera linhas ER');
assertEqual(res.summary.some(r=>r.isTN&&r.hours>0), false, 'Prevencao nao gera TN');
const prevShift=res.shifts.find(s=>s.date==='2026-05-02');
assertClose(prevShift.totalH, 0, 0.01, 'Prevencao nao entra em totalH (nao sao horas trabalhadas)');
assertClose(prevShift.prevH, 12, 0.01, 'prevH regista as 12h de prevencao');

// Exatamente 50% do turno ER equivalente (sem contrato por cumprir, para que
// nenhuma hora seja absorvida como contrato/TN).
const erEntry={date:'2026-05-02', inMonth:true, regularHours:0, er:true,
               start:'20:00', end:'08:00', workType:'', bancoType:'noite'};
const resEr=computeMonth([erEntry], {dailyContractHours:0, weeklyContract:0, hourly:R,
                                     initialDeficit:0, regime:'geral'});
const erEur=resEr.summary.filter(r=>r.isER).reduce((a,r)=>a+r.eur,0);
assertClose(prevRow.eur, erEur*0.5, 0.01, 'Prevencao = 50% do turno ER equivalente');

/* --- Banco Dia + Prevencao no MESMO dia (janelas distintas) --- */
const both=[{date:'2026-05-02', inMonth:true, regularHours:0, er:true, prevention:true,
             start:'08:00', end:'20:00', workType:'', bancoType:'dia'}];
// contrato ja cumprido (weeklyContract 0) para que o turno de dia seja todo
// extraordinario -- com contrato por cumprir seria absorvido como contrato de
// dia, que nao gera linha nenhuma (nem ER nem TN).
const resBoth=computeMonth(both, {dailyContractHours:0, weeklyContract:0, hourly:R, initialDeficit:0, regime:"geral"});
const prevBoth=resBoth.summary.find(r=>r.key==='PREV');
assert(!!prevBoth, 'D+P: linha PREV presente');
assertClose(prevBoth.hours, 12, 0.01, 'D+P: a prevencao mantem as 12h da noite');
assertClose(prevBoth.eur, prevRow.eur, 0.01, 'D+P: a prevencao vale o mesmo que sozinha');
assertEqual(resBoth.summary.some(r=>(r.isER||r.isTN)&&r.hours>0), true,
            'D+P: o turno de dia continua a gerar ER/TN');
const shiftBoth=resBoth.shifts.find(s=>s.date==='2026-05-02');
assertClose(shiftBoth.totalH, 12, 0.01, 'D+P: totalH conta so o turno de banco (12h)');
assertClose(shiftBoth.prevH, 12, 0.01, 'D+P: prevH conta a prevencao em separado');

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

/* --- collectEntries --- */
const sat=UI.rowByDate['2026-05-02'];
sat.prev=true; sat.banco='';
let e=collectEntries().find(x=>x.date==='2026-05-02');
assertEqual(e.prevention, true, 'Sabado com P: prevention=true');
assertEqual(e.start+'|'+e.end, '|', 'Prevencao nao usa start/end (janela vem das regras)');

sat.banco='dia';
e=collectEntries().find(x=>x.date==='2026-05-02');
assertEqual(e.er && e.prevention, true, 'Sabado com D+P: as duas coexistem na mesma entrada');
assertEqual(e.start+'-'+e.end, '08:00-20:00', 'D+P: start/end sao os do turno de banco');
sat.banco=''; sat.prev=false;

const mon=UI.rowByDate['2026-05-04'];
mon.prev=true;
e=collectEntries().find(x=>x.date==='2026-05-04');
assertEqual(!e || e.prevention===false, true, 'P num dia util e ignorada');
mon.prev=false;

console.log('OK: Prevencao (P) -- fim de semana, janela propria, metade do turno, coexiste com D — '+CHECKS_RUN+' assercoes.');
`);
