const {loadApp}=require('./harness');

// --- Guardar: preencher estado e confirmar que fica em localStorage ---
let app=loadApp();
app.run(`
localStorage.removeItem(CHECKER_STORAGE_KEY);
document.getElementById('selCategory').value='assistente';
document.getElementById('selRegime').value='plena';
document.getElementById('selStartMonth').value='5';
document.getElementById('selStartYear').value='2026';
updatePeriodAvailability();
buildCalendar();
UI.rowByDate['2026-05-06'].work='extra';   // dia especifico marcado como Alternativo
renderManualCalendar();
document.getElementById('chkDL119').checked=true;
document.getElementById('inpDL119PriorHours').value='42';
calculate();

const raw=localStorage.getItem(CHECKER_STORAGE_KEY);
assert(!!raw, 'saveState() grava algo em localStorage apos editar o calendario');
const saved=JSON.parse(raw);
assertEqual(saved.selCategory, 'assistente', 'estado guardado: categoria');
assertEqual(saved.selRegime, 'plena', 'estado guardado: regime');
assertEqual(saved.chkDL119, true, 'estado guardado: DL119 ligado');
assertEqual(saved.inpDL119PriorHours, '42', 'estado guardado: horas previas DL119');
assertEqual(saved.rows['2026-05-06'].work, 'extra', 'estado guardado: dia especifico com Alternativo');

console.log('OK: saveState() persiste o estado completo em localStorage — '+CHECKS_RUN+' assercoes.');
`);

// --- Restaurar: simula reload passando a MESMA localStorage para uma nova instancia da app ---
const savedRaw=app.ctx.localStorage.getItem('erTnChecker_state_v1');
app=loadApp();
app.ctx.localStorage.setItem('erTnChecker_state_v1', savedRaw);
app.run(`
// Antes de restaurar: estado ainda no arranque "em branco" (defeito)
assertEqual(document.getElementById('selRegime').value, 'geral', 'antes de restaurar: regime no defeito (geral)');
assertEqual(document.getElementById('chkDL119').checked, false, 'antes de restaurar: DL119 desligado por defeito');

const saved=loadSavedState();
assert(!!saved, 'loadSavedState() le o que foi guardado na "sessao anterior"');
applyState(saved);

assertEqual(document.getElementById('selRegime').value, 'plena', 'apos restaurar: regime=plena');
assertEqual(document.getElementById('selCategory').value, 'assistente', 'apos restaurar: categoria=assistente');
assertEqual(document.getElementById('selStartMonth').value, '5', 'apos restaurar: mes=Maio');
assertEqual(document.getElementById('chkDL119').checked, true, 'apos restaurar: DL119 ligado');
assertEqual(document.getElementById('inpDL119PriorHours').value, '42', 'apos restaurar: horas previas=42');
assertEqual(UI.rowByDate['2026-05-06'].work, 'extra', 'apos restaurar: dia especifico com Alternativo preservado');

console.log('OK: applyState()/loadSavedState() restauram o estado completo, incluindo o calendario dia-a-dia — '+CHECKS_RUN+' assercoes.');
`);

// --- SAVE_ENABLED fica false enquanto o banner de restauro esta pendente,
// para nao sobrescrever os dados guardados com o estado "em branco" do
// arranque normal antes do utilizador decidir Restaurar/Descartar. ---
app=loadApp();
app.ctx.localStorage.setItem('erTnChecker_state_v1', savedRaw);
app.run(`
SAVE_ENABLED=false;
document.getElementById('selRegime').value='geral';   // simula o arranque normal a repor o defeito
calculate();
const stillIntact=JSON.parse(localStorage.getItem(CHECKER_STORAGE_KEY));
assertEqual(stillIntact.selRegime, 'plena', 'com SAVE_ENABLED=false, o estado guardado NAO e sobrescrito');
SAVE_ENABLED=true;
calculate();
const afterEnable=JSON.parse(localStorage.getItem(CHECKER_STORAGE_KEY));
assertEqual(afterEnable.selRegime, 'geral', 'com SAVE_ENABLED=true, volta a guardar normalmente');

console.log('OK: SAVE_ENABLED protege os dados guardados enquanto o banner de restauro esta pendente — '+CHECKS_RUN+' assercoes.');
`);
