const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selRotinaH').value='7';
document.getElementById('selTardeH').value='6';
document.getElementById('selExtraH').value='4';
document.getElementById('selBolsaH').value='4';
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();

// 2026-05-02 = Sabado, 2026-05-03 = Domingo (sem serem feriado)
assertEqual(UI.rowByDate['2026-05-02'].work, '', 'Sabado: sem prefill automatico');
assertEqual(UI.rowByDate['2026-05-03'].work, '', 'Domingo: sem prefill automatico');

// Ao fim de semana o unico tipo de trabalho normal aceite e Alternativo (A);
// tudo o resto -- Rotina, Tarde, Bolsa de Horas e tambem Folga -- e IGNORADO
// no calculo (zero horas), mesmo que tenha ficado em estado guardado antigo.
const sat=UI.rowByDate['2026-05-02'];
function checkIgnored(key, shouldBeIgnored, label){
  sat.work=key;
  const e=collectEntries().find(x=>x.date==='2026-05-02');
  const ignored=!e || e.regularHours===0;
  assertEqual(ignored, shouldBeIgnored, label);
}
checkIgnored('rotina', true, 'Sabado com Rotina: ignorado (0h)');
checkIgnored('tarde', true, 'Sabado com Tarde: ignorado (0h)');
checkIgnored('bolsa', true, 'Sabado com Bolsa de Horas: ignorado (0h)');
checkIgnored('extra', false, 'Sabado com Alternativo: NAO ignorado (sem regra ainda)');
checkIgnored('folga', true, 'Sabado com Folga: ignorado (fim de semana so aceita A)');

// Dia util normal (Segunda) nunca e ignorado
const mon=UI.rowByDate['2026-05-04'];
mon.work='rotina';
const eMon=collectEntries().find(x=>x.date==='2026-05-04');
assertEqual(eMon.regularHours, 7, 'Segunda (dia util) com Rotina: NAO ignorado, conta as 7h');

console.log('OK: prefill de fim de semana/feriado + fim de semana so aceita A (R/T/BH/F ignorados) — '+CHECKS_RUN+' assercoes.');
`);
