const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='plena';
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
document.getElementById('chkDL119').checked=true;

// --- Caso A: bem abaixo do limite (0h prior, sem turnos reais) -> mensagem
// simplificada "abaixo do limite minimo", condicao de majoracao ESCONDIDA ---
document.getElementById('inpDL119PriorHours').value='0';
calculate();
let summary=document.getElementById('dl119Summary').innerHTML;
assertEqual(summary.includes('não aplicável'), true, 'abaixo do minimo: mensagem simplificada');
assertEqual(summary.includes('abaixo do limite mínimo anual'), true, 'abaixo do minimo: menciona o limite minimo');
assertEqual(document.getElementById('dl119WeeksDetails').style.display, 'none', 'abaixo do minimo: condicao de majoracao escondida');

// --- Caso B: perto do limite mas ainda por baixo (240h < 250h Plena) -- mesma logica ---
document.getElementById('inpDL119PriorHours').value='240';
calculate();
summary=document.getElementById('dl119Summary').innerHTML;
assertEqual(summary.includes('não aplicável'), true, '240h<250h: ainda abaixo do minimo');
assertEqual(document.getElementById('dl119WeeksDetails').style.display, 'none', '240h<250h: condicao de majoracao escondida');

// --- Caso C: excesso>0 mas nao fecha o 1o bloco (sem ultimo bloco) --
// mensagem detalhada de sempre, condicao de majoracao VISIVEL ---
document.getElementById('inpDL119PriorHours').value='260';   // excesso=10h
document.getElementById('chkDL119LastBlock').checked=false;
calculate();
summary=document.getElementById('dl119Summary').innerHTML;
assertEqual(summary.includes('1º bloco completo'), true, '10h de excesso: mensagem sobre o 1o bloco completo');
assertEqual(document.getElementById('dl119WeeksDetails').style.display, '', '10h de excesso: condicao de majoracao visivel');

// --- Caso D: excesso fecha 1 bloco completo -- aplica, condicao visivel,
// linhas DL119 aparecem dentro do Output 1. priorHours=200h fica ABAIXO do
// limite (250h plena, priorExcess=0 -- nada "ja pago" antes), e este periodo
// contribui varias horas reais de banco noite para realmente FECHAR um bloco
// agora (tem de ser trabalho NOVO, nao so priorHours, para o delta aparecer).
document.getElementById('inpDL119PriorHours').value='200';
UI.manualRows.forEach(r=>{ if(r.inMonth){ const dow=parseISO(r.date).getDay(); if(dow>=1&&dow<=5) r.banco='noite'; } });
calculate();
summary=document.getElementById('dl119Summary').innerHTML;
assertEqual(summary.includes('detalhe do ajuste'), true, '50h de excesso: aplica, remete para a tabela');
assertEqual(document.getElementById('dl119WeeksDetails').style.display, '', '50h de excesso: condicao de majoracao visivel');
const tbody=document.querySelector('#summaryTable tbody').innerHTML;
const tfoot=document.querySelector('#summaryTable tfoot').innerHTML;
assertEqual(tbody.includes('>DL119<'), true, 'DL119 aplica: linhas DL119 dentro do Output 1');
assertEqual(tbody.includes('Incentivo bloco'), true, 'DL119 aplica: linha de incentivo por bloco presente');
assertEqual(tfoot.includes('+DL119'), true, 'DL119 aplica: TOTAIS do Output 1 inclui +DL119');

// --- DL119 desligado -> linha/condicao desaparecem, Output 2 (Output 1 aqui) sem +DL119 ---
document.getElementById('chkDL119').checked=false;
calculate();
assertEqual(document.getElementById('dl119LastBlockRow').style.display, 'none', 'DL119 off: linha do ultimo bloco escondida');
assertEqual(document.querySelector('#summaryTable tfoot').innerHTML.includes('+DL119'), false, 'DL119 off: sem +DL119 no total');

console.log('OK: DL119 abaixo do minimo (mensagem simplificada + condicao de majoracao escondida) e wiring no Output 1 — '+CHECKS_RUN+' assercoes.');
`);
