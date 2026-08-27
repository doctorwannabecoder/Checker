const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* Dedicacao Plena: o dia UTIL a seguir a uma Urgencia Noite e dia de descanso,
   por isso vem pre-preenchido com Bolsa de Horas em vez de Rotina. A regra e
   DERIVADA (nao gravada), por isso:
     - muda sozinha ao trocar de regime, nos dois sentidos;
     - nao se aplica a fins de semana nem a feriados;
     - nunca sobrepoe um dia que o utilizador escolheu a mao. */
document.getElementById('selCategory').value='assistente';
fillRegimeOptions();
document.getElementById('selStartYear').value='2026';

function setRegime(r){ document.getElementById('selRegime').value=r; onRegimeChange(); }

// 2026-05-05 = Terca -> 2026-05-06 = Quarta (dia util)
setRegime('geral');
setPeriod(5,1);
UI.rowByDate['2026-05-05'].banco='noite'; rememberDay('2026-05-05');
refreshDerivedNextDay('2026-05-05');

assertEqual(UI.rowByDate['2026-05-06'].work, 'rotina', 'Geral: dia a seguir a noite fica Rotina');

setRegime('plena');
assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', 'Plena: dia a seguir a noite passa a Bolsa de Horas');
assertEqual(UI.entries['2026-05-06'], undefined, 'a regra e derivada — nao grava nada no dia seguinte');

setRegime('exclusiva');
assertEqual(UI.rowByDate['2026-05-06'].work, 'rotina', 'Exclusiva: volta a Rotina');
setRegime('geral');
assertEqual(UI.rowByDate['2026-05-06'].work, 'rotina', 'Geral: continua Rotina');
setRegime('plena');
assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', 'Plena outra vez: volta a Bolsa de Horas');

/* --- nao se aplica a fim de semana: 2026-05-08 = Sexta -> 09 = Sabado --- */
UI.rowByDate['2026-05-08'].banco='noite'; rememberDay('2026-05-08');
buildCalendar();
assertEqual(parseISO('2026-05-09').getDay(), 6, '2026-05-09 e mesmo Sabado');
assertEqual(UI.rowByDate['2026-05-09'].work, '', 'fim de semana a seguir a noite fica vazio');

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
assertEqual(UI.rowByDate[feriado].work, 'folga',
  'feriado a seguir a noite continua Folga (a regra nao se aplica)');

/* --- nunca sobrepoe uma escolha do utilizador --- */
setPeriod(5,1);
setRegime('plena');
assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', 'ponto de partida: derivado como Bolsa');
UI.rowByDate['2026-05-06'].work='tarde'; rememberDay('2026-05-06');   // escolha explicita
buildCalendar();
assertEqual(UI.rowByDate['2026-05-06'].work, 'tarde', 'escolha do utilizador aguenta o rebuild');
setRegime('geral');
assertEqual(UI.rowByDate['2026-05-06'].work, 'tarde', 'escolha do utilizador aguenta a troca de regime');

/* --- desligar a noite devolve o dia seguinte a Rotina --- */
delete UI.entries['2026-05-06'];      // volta a ser derivado
setRegime('plena');
assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', 'derivado outra vez: Bolsa');
UI.rowByDate['2026-05-05'].banco=''; rememberDay('2026-05-05');
refreshDerivedNextDay('2026-05-05');
assertEqual(UI.rowByDate['2026-05-06'].work, 'rotina', 'sem noite na vespera: volta a Rotina');

/* --- 24h conta como noite --- */
UI.rowByDate['2026-05-05'].banco='h24'; rememberDay('2026-05-05');
refreshDerivedNextDay('2026-05-05');
assertEqual(UI.rowByDate['2026-05-06'].work, 'bolsa', 'Urgencia 24h tambem implica descanso no dia seguinte');

console.log('OK: Dedicacao Plena — Bolsa de Horas derivada no dia a seguir a Urgencia Noite — '+CHECKS_RUN+' assercoes.');
`);
