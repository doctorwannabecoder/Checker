const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* O histórico existe para uma coisa: preencher mês a mês tem de dar o MESMO
   que preencher o período todo de uma vez. Sem ele, cada mês recomeçava com
   défice zero e o total do ano ficava inflacionado. */
document.getElementById('selCategory').value='assistente';
fillRegimeOptions(); document.getElementById('selRegime').value='geral';
document.getElementById('selStartYear').value='2026';

function ctxNow(){ return {dailyContractHours:dailyContractHours(), weeklyContract:currentWeekly(),
  hourly:erHourly(), initialDeficit:initialDeficitHours(), regime:currentRegime()}; }

const maioD=['2026-05-05','2026-05-12','2026-05-19'];
const junhoD=['2026-06-02','2026-06-09'];

// --- preencher Maio e Junho ---
setPeriod(5,1);
maioD.forEach(d=>{ UI.rowByDate[d].banco='noite'; rememberDay(d); });
setPeriod(6,1);
junhoD.forEach(d=>{ UI.rowByDate[d].banco='noite'; rememberDay(d); });

/* --- A) mês a mês, cada um com o histórico do anterior --- */
setPeriod(5,1);
UI.history=computeHistory();
assertEqual(UI.history, null, 'Maio e o primeiro mes: sem historico');
const maio=computeMonth(collectEntries(), ctxNow());

setPeriod(6,1);
UI.history=computeHistory();
assert(!!UI.history, 'Junho ja tem historico (Maio)');
assertEqual(UI.history.months.length, 1, 'historico = 1 mes (Maio)');
assertEqual(UI.history.months[0].m, 5, 'o mes do historico e Maio');
assert(UI.history.deficit>0, 'o historico traz um defice acumulado > 0');
assertClose(initialDeficitHours(), UI.history.deficit, 0.01,
  'o defice inicial do periodo vem do historico, nao do campo manual');
assertClose(dl119PriorHours(), UI.history.erHours, 0.01,
  'as horas ER previas do DL119 tambem vem do historico');
const junho=computeMonth(collectEntries(), ctxNow());

/* --- B) os dois meses de uma vez --- */
setPeriod(5,2);
UI.history=computeHistory();
assertEqual(UI.history, null, 'periodo que comeca em Maio: nada antes dele');
const juntos=computeMonth(collectEntries(), ctxNow());

const somaMesAMes=maio.totalExtraEur+junho.totalExtraEur;
assertClose(somaMesAMes, juntos.totalExtraEur, 0.02,
  'mes a mes (com historico) = periodo inteiro de uma vez');

/* --- o histórico soma o que já foi ganho --- */
setPeriod(6,1);
UI.history=computeHistory();
assertClose(UI.history.extraEur, maio.totalExtraEur, 0.02,
  'o extra do historico e exatamente o que Maio rendeu');
assertClose(UI.history.base.total, baseForMonths([{y:2026,m:5}]).total, 0.01,
  'a base do historico e a de Maio');
assertClose(UI.history.total, round2(UI.history.base.total+maio.totalExtraEur), 0.02,
  'total do historico = base + extra');

/* --- a tabela do separador anual --- */
const res=computeMonth(collectEntries(), ctxNow());
renderHistory(res);
const card=document.getElementById('historyCard');
assertEqual(card.style.display, 'block', 'com historico, o cartao aparece');
const corpo=document.querySelector('#historyTable tbody').innerHTML;
const rodape=document.querySelector('#historyTable tfoot').innerHTML;
assertEqual(rodape.includes('ACUMULADO'), true, 'a tabela tem a linha do acumulado');
assertEqual(corpo.includes('Maio 2026'), true, 'a tabela identifica os meses do historico');
assertEqual(corpo.includes('Junho 2026'), true, 'a tabela identifica o periodo selecionado');

/* --- sem histórico o cartão desaparece --- */
setPeriod(5,1);
UI.history=computeHistory();
renderHistory(computeMonth(collectEntries(), ctxNow()));
assertEqual(document.getElementById('historyCard').style.display, 'none',
  'sem historico o cartao fica escondido');

/* --- ano completo ignora o historico (esta tudo dentro do periodo) --- */
setPeriod(1,12);
UI.history=computeHistory();
assertEqual(initialDeficitHours(), 0, 'ano completo: sem defice previo');
assertEqual(dl119PriorHours(), 0, 'ano completo: sem horas ER previas');

console.log('OK: historico — mes a mes com defice herdado = periodo inteiro — '+CHECKS_RUN+' assercoes.');
`);
