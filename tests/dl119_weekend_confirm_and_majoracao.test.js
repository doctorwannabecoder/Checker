const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='geral';
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
UI.manualRows.forEach(r=>{ if(r.inMonth){ const dow=parseISO(r.date).getDay(); if(dow>=1&&dow<=5) r.banco='noite'; } });

// Caso A: DL119 desligado -> linha de confirmacao de fim de semana escondida
document.getElementById('chkDL119').checked=false;
document.getElementById('inpDL119PriorHours').value='0';
calculate();
assertEqual(document.getElementById('dl119WeekendConfirmRow').style.display, 'none', 'DL119 off: linha escondida');

// Caso B: DL119 ligado, priorHours=100 (<150 limite geral) -> continua escondida
document.getElementById('chkDL119').checked=true;
document.getElementById('inpDL119PriorHours').value='100';
calculate();
assertEqual(document.getElementById('dl119WeekendConfirmRow').style.display, 'none', 'prior=100<150: linha escondida');

// Caso C: priorHours=160 (>150) -> linha visivel
document.getElementById('inpDL119PriorHours').value='160';
calculate();
assertEqual(document.getElementById('dl119WeekendConfirmRow').style.display, '', 'prior=160>150: linha visivel');

// Caso D: confirmar o toggle global -> UI.dl119WeekendConfirmed=true, e TODOS
// os blocos ativos no Output 1 saem com o checkbox "majorado" marcado
document.getElementById('chkDL119WeekendConfirm').checked=true;
toggleDL119WeekendConfirm();
assertEqual(UI.dl119WeekendConfirmed, true, 'toggle confirmado: UI.dl119WeekendConfirmed=true');
const tbody=document.querySelector('#summaryTable tbody').innerHTML;
const blockRows=(tbody.match(/Incentivo bloco[^]*?<\\/tr>/g))||[];
assertEqual(blockRows.length>0, true, 'ha pelo menos 1 linha de bloco DL119 no Output 1');
assertEqual(blockRows.every(r=>r.includes('checked')), true, 'com o toggle confirmado, TODOS os blocos saem majorados (checked)');

// Caso E: baixar priorHours de volta a 100 -> linha esconde-se e o toggle reseta sozinho
document.getElementById('inpDL119PriorHours').value='100';
calculate();
assertEqual(document.getElementById('dl119WeekendConfirmRow').style.display, 'none', 'de volta a prior=100: linha esconde-se');
assertEqual(UI.dl119WeekendConfirmed, false, 'de volta a prior=100: confirmacao reseta automaticamente');

console.log('OK: linha de confirmacao de fim de semana (Art.5o) e propagacao da majoracao para os blocos — '+CHECKS_RUN+' assercoes.');
`);
