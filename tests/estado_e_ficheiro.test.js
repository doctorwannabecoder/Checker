const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
/* 1) Mudar de período NÃO pode apagar o que já estava preenchido.
   (Antes de UI.entries, buildCalendar() reconstruía tudo do zero e perdia-se.) */
document.getElementById('selCategory').value='assistente';
document.getElementById('selStartYear').value='2026';
setPeriod(5,1);

UI.rowByDate['2026-05-09'].banco='dia';   rememberDay('2026-05-09');
UI.rowByDate['2026-05-09'].prev=true;     rememberDay('2026-05-09');
UI.rowByDate['2026-05-06'].work='extra';  rememberDay('2026-05-06');

setPeriod(5,2);                            // Maio + Junho
assertEqual(UI.rowByDate['2026-05-09'].banco, 'dia', 'acrescentar um mes mantem o Banco Dia');
assertEqual(UI.rowByDate['2026-05-09'].prev, true,   'acrescentar um mes mantem a Prevencao');
assertEqual(UI.rowByDate['2026-05-06'].work, 'extra','acrescentar um mes mantem o trabalho normal');

setPeriod(7,1);                            // periodo que nem inclui Maio
assertEqual(UI.entries['2026-05-09'].banco, 'dia', 'dias fora do periodo continuam guardados');
setPeriod(5,1);                            // voltar
assertEqual(UI.rowByDate['2026-05-09'].banco, 'dia', 'ao voltar a Maio o dia reaparece preenchido');
assertEqual(UI.rowByDate['2026-05-09'].prev, true,   'ao voltar a Maio a Prevencao reaparece');

// o pre-preenchimento continua a funcionar nos dias nunca tocados
assertEqual(UI.rowByDate['2026-05-04'].work, 'rotina', 'dia nunca tocado mantem o prefill (Rotina)');
// e um dia limpo pelo utilizador fica limpo (nao volta ao prefill)
UI.rowByDate['2026-05-04'].work=''; rememberDay('2026-05-04');
setPeriod(5,2); setPeriod(5,1);
assertEqual(UI.rowByDate['2026-05-04'].work, '', 'dia limpo pelo utilizador NAO volta ao prefill');

/* 2) Exportar / importar ficheiro */
const json=stateToJSON();
const parsed=JSON.parse(json);
assertEqual(typeof parsed.entries, 'object', 'o ficheiro leva os dias preenchidos');
assertEqual(parsed.entries['2026-05-09'].banco, 'dia', 'o ficheiro leva o Banco Dia');
assertEqual(parsed.entries['2026-05-09'].prev, true, 'o ficheiro leva a Prevencao');
assertEqual(stateFileName(), 'checker-2026-05-1m.json', 'nome do ficheiro identifica periodo');

// baralhar tudo e reimportar
setPeriod(9,2);
UI.entries={};
buildCalendar();
assertEqual(UI.rowByDate['2026-05-09'], undefined, 'depois de limpar, Maio nem esta no periodo');

assertEqual(applyImportedState(json), true, 'importar um ficheiro valido devolve true');
// importar CONTINUA de onde o ficheiro ficou: salta para o mes a seguir ao
// ultimo com dias preenchidos (Maio -> Junho), com 1 mes selecionado
assertEqual(document.getElementById('selStartMonth').value, '6', 'importar salta para o mes seguinte (Junho)');
assertEqual(document.getElementById('selStartYear').value, '2026', 'importar mantem o ano');
assertEqual(numMeses(), 1, 'importar seleciona 1 mes');
assertEqual(UI.entries['2026-05-09'].banco, 'dia', 'importar repoe os dias preenchidos');
assertEqual(UI.entries['2026-05-09'].prev, true, 'importar repoe a Prevencao');
assertEqual(UI.rowByDate['2026-05-09'], undefined, 'Maio ja nao esta no periodo mostrado');

// ficheiros invalidos nao rebentam nem apagam nada
assertEqual(applyImportedState('isto nao e json'), false, 'texto invalido -> false');
assertEqual(applyImportedState('{"outra":"coisa"}'), false, 'json sem entries -> false');
assertEqual(applyImportedState('null'), false, 'null -> false');
assertEqual(UI.entries['2026-05-09'].banco, 'dia', 'apos importacao falhada o estado fica intacto');

/* 3) A Prevencao aparece no Output 2 */
const R=20;
const res=computeMonth([{date:'2026-05-09', inMonth:true, regularHours:0, er:false, prevention:true,
                         start:'', end:'', workType:'', bancoType:''}],
                       {dailyContractHours:0, weeklyContract:0, hourly:R, initialDeficit:0, regime:'geral'});
const sh=res.shifts.find(x=>x.date==='2026-05-09');
assertEqual(sh.isPrev, true, 'o dia e marcado como prevencao');
assertEqual(sh.days.length, 2, 'a prevencao tambem e repartida pelos 2 dias que atravessa');
assertClose(sh.days.reduce((t,d)=>t+d.allocations.reduce((x,a)=>x+a.hours,0),0), 12, 0.01,
  'as 12h da prevencao estao repartidas pelos dias');

renderShifts(res.shifts.filter(x=>x.isER||x.isPrev));
const html=document.getElementById('shiftsArea').innerHTML;
assertEqual(html.includes('pill prev'), true, 'Output 2 mostra a Prevencao com o seu proprio pill');
assertEqual(html.includes('9–10/05/2026'), true, 'Output 2 mostra o intervalo da prevencao (9-10)');
assertEqual(html.includes('20:00–08:00'), true, 'Output 2 mostra a janela da prevencao');

console.log('OK: estado sobrevive a mudancas de periodo · exportar/importar · Prevencao no Output 2 — '+CHECKS_RUN+' assercoes.');
`);
