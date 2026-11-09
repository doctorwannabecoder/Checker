const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Em qualquer regime, o dia UTIL a seguir a uma Urgencia Noite (ou 24h) fica em
   Bolsa de Horas, bloqueado. A regra e DERIVADA (nao gravada), por isso:
     - vale em todos os regimes;
     - nao se aplica a fins de semana nem a feriados;
     - ganha a qualquer valor guardado, que volta se a noite for desligada. */
document.getElementById('selCategory').value='assistente';
fillRegimeOptions();
document.getElementById('selStartYear').value='2026';
document.getElementById('selBolsaH').value='4';

function setRegime(r){ document.getElementById('selRegime').value=r; onRegimeChange(); }
function setN(date,banco){ UI.rowByDate[date].banco=banco; rememberDay(date); refreshDerivedNextDay(date); }

// 2026-05-05 = Terca -> 2026-05-06 = Quarta (dia util)
setRegime('geral');
setPeriod(5,1);
assertEqual(UI.rowByDate['2026-05-06'].work, 'rotina', 'sem noite na vespera: Rotina');
assertEqual(isLockedBolsa('2026-05-06'), false, 'sem noite na vespera: nao bloqueado');
setN('2026-05-05','noite');

['geral','plena','exclusiva'].forEach(r=>{
  setRegime(r);
  assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', r+': dia a seguir a noite fica Bolsa de Horas');
  assertEqual(isLockedBolsa('2026-05-06'), true, r+': dia a seguir a noite fica bloqueado');
});
assertEqual(UI.entries['2026-05-06'], undefined, 'a regra e derivada — nao grava nada no dia seguinte');
setRegime('geral');

/* --- bloqueio visivel e efeito no calculo --- */
const html=document.getElementById('manualCal').innerHTML;
const seg=html.split('work-toggles" data-d="2026-05-06"')[1].split('</div>')[0];
assertEqual(seg.split(' disabled>').length-1, 4, 'os 4 botoes do dia ficam desativados');
assert(/work-btn active" data-k="bolsa"/.test(seg), 'BH fica marcado');
const e=entryFromRow(UI.rowByDate['2026-05-06']);
assertEqual(e.workType, 'bolsa', 'calculo usa Bolsa de Horas');
assertClose(e.regularHours, 4, 0.001, 'calculo usa as horas da Bolsa');

/* --- nao se aplica a fim de semana: 2026-05-08 = Sexta -> 09 = Sabado --- */
setN('2026-05-08','noite');
buildCalendar();
assertEqual(parseISO('2026-05-09').getDay(), 6, '2026-05-09 e mesmo Sabado');
assertEqual(UI.rowByDate['2026-05-09'].work, '', 'fim de semana a seguir a noite fica vazio');
assertEqual(isLockedBolsa('2026-05-09'), false, 'fim de semana nao bloqueia');

/* --- nao se aplica a feriado: procurar um feriado em dia util --- */
let feriado=null;
for(let d=parseISO('2026-05-01'); d<=parseISO('2026-12-20'); d=addDays(d,1)){
  const iso1=iso(d), dow=d.getDay();
  if(dayKind(iso1)==='holiday' && dow!==0 && dow!==6){ feriado=iso1; break; }
}
assert(!!feriado, 'ha pelo menos um feriado em dia util em 2026');
const vespera=iso(addDays(parseISO(feriado),-1));
setPeriod(parseISO(feriado).getMonth()+1,1);
if(UI.rowByDate[vespera]){ UI.rowByDate[vespera].banco='noite'; rememberDay(vespera); }
buildCalendar();
assertEqual(UI.rowByDate[feriado].work, '',
  'feriado a seguir a noite continua vazio (a regra nao se aplica)');

/* --- ganha a um valor guardado, que volta ao desligar a noite --- */
setPeriod(5,1);
UI.entries['2026-05-06']={work:'tarde', banco:'', prev:false};
buildCalendar();
assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', 'valor guardado nao fura o bloqueio');
assertEqual(entryFromRow(UI.rowByDate['2026-05-06']).workType, 'bolsa', 'nem no calculo');
setN('2026-05-05','');
assertEqual(UI.rowByDate['2026-05-06'].work, 'tarde', 'sem noite: volta a escolha guardada');
delete UI.entries['2026-05-06'];

/* --- mexer na urgencia de um dia bloqueado nao grava a Bolsa --- */
buildCalendar();
setN('2026-05-05','noite');
UI.rowByDate['2026-05-06'].prev=false; rememberDay('2026-05-06');
assertEqual(UI.entries['2026-05-06'].work, 'rotina', 'dia bloqueado guarda Rotina, nao a Bolsa');
setN('2026-05-05','');
assertEqual(UI.rowByDate['2026-05-06'].work, 'rotina', 'sem noite na vespera: volta a Rotina');
delete UI.entries['2026-05-06'];

/* --- 24h conta como noite --- */
setN('2026-05-05','h24');
assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', 'Urgencia 24h tambem implica descanso no dia seguinte');

/* --- historico: mesma regra --- */
assertEqual(rowForDate('2026-05-06', true).work, 'bolsa', 'historico usa a mesma regra');

console.log('OK: Bolsa de Horas bloqueada no dia util a seguir a Urgencia Noite — '+CHECKS_RUN+' assercoes.');
`);
