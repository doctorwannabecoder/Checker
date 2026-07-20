const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
renderManualCalendar();

// --- estrutura: sem o antigo <select class="banco">, com os novos toggles D/N ---
let html=document.getElementById('manualCal').innerHTML;
assertEqual(html.includes('banco-toggles'), true, 'contem os banco-toggles');
assertEqual(/<button[^>]*class="banco-btn banco-d[^"]*"[^>]*>D</.test(html), true, 'contem o botao D');
assertEqual(/<button[^>]*class="banco-btn banco-n[^"]*"[^>]*>N</.test(html), true, 'contem o botao N');
assertEqual(!html.includes('class="banco"'), true, 'ja NAO contem o antigo select.banco');

// --- D/N/H24: estados corretos e independentes ---
const target=UI.manualRows.find(r=>r.inMonth);
target.banco='dia'; renderManualCalendar();
html=document.getElementById('manualCal').innerHTML;
assertEqual(html.includes('banco-d active'), true, 'Banco Dia sozinho: D fica active');
assertEqual(!html.includes('banco-n active'), true, 'Banco Dia sozinho: N NAO fica active');

target.banco='noite'; renderManualCalendar();
html=document.getElementById('manualCal').innerHTML;
assertEqual(html.includes('banco-n active'), true, 'Banco Noite sozinho: N fica active');
assertEqual(!html.includes('banco-d active'), true, 'Banco Noite sozinho: D NAO fica active');

target.banco='h24'; renderManualCalendar();
html=document.getElementById('manualCal').innerHTML;
assertEqual(html.includes('banco-d active') && html.includes('banco-n active'), true, 'Banco 24h: D e N ambos active');

// cada dia tem exatamente 2 blocos data-d (work-toggles + banco-toggles)
let re=/data-d="([^"]+)"/g, counts={}, m;
while((m=re.exec(html))){ counts[m[1]]=(counts[m[1]]||0)+1; }
const badBanco=UI.manualRows.map(r=>r.date).filter(d=>counts[d]!==2);
assertEqual(badBanco.length, 0, 'todos os dias tem exatamente 2 blocos data-d (work+banco)');

// --- trabalho normal: toggles R/T/A/F/BH, um so por dia ---
target.banco='';
target.work='tarde'; renderManualCalendar();
html=document.getElementById('manualCal').innerHTML;
assertEqual(!html.includes('data-f="work"'), true, 'ja NAO contem o antigo select data-f="work"');
assertEqual(html.includes('work-toggles'), true, 'contem os work-toggles');
assertEqual(html.includes('work-btn active" data-k="tarde"'), true, 'botao Tarde marcado active');
assertEqual(html.includes('class="legendcol"'), true, 'coluna de legenda (cabecalho) presente');

const wtIdx=html.indexOf('work-toggles');
const wtEnd=html.indexOf('</div>', wtIdx);
const wtSnippet=html.slice(wtIdx, wtEnd);
const btnCount=(wtSnippet.match(/class="work-btn/g)||[]).length;
assertEqual(btnCount, 5, 'work-toggles: 5 botoes por dia (rotina/tarde/alternativo/folga/bolsa)');

target.work='folga'; renderManualCalendar();
html=document.getElementById('manualCal').innerHTML;
assertEqual(html.includes('work-btn active" data-k="folga"'), true, 'apos mudar: Folga marcado active');
assertEqual(!html.includes('work-btn active" data-k="tarde"'), true, 'apos mudar: Tarde ja nao esta active');

re=/data-d="([^"]+)"/g; counts={};
while((m=re.exec(html))){ counts[m[1]]=(counts[m[1]]||0)+1; }
const badWork=UI.manualRows.map(r=>r.date).filter(d=>counts[d]!==2);
assertEqual(badWork.length, 0, 'apos alterar trabalho: continuam 2 blocos data-d por dia');

console.log('OK: toggles de Banco (D/N/H24) e de Trabalho normal (R/T/A/F/BH) — '+CHECKS_RUN+' assercoes.');
`);
