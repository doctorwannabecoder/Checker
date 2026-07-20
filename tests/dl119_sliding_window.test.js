const {loadApp}=require('./harness');
const app=loadApp();
app.run(`
// Janela deslizante de 8 semanas (Art.5o/1): 10 semanas fictícias, 8 delas
// com 10h de banco ao fim de semana cada (soma 80h nas ultimas 8 semanas).
const weeklyStats=[];
const hoursPerWeek=[10,10,10,10,10,10,10,10,0,0];
for(let i=0;i<10;i++){
  weeklyStats.push({week:'W'+i, monday:'2026-01-'+String(1+i).padStart(2,'0'),
    sunday:'2026-01-'+String(1+i).padStart(2,'0'), weekendBancoH:hoursPerWeek[i]});
}
const windows=dl119WeekendWindows(weeklyStats);
assertEqual(windows.length, 10, 'uma janela por semana avaliada');
// a partir da 8a semana (W7, indice 7) ha 8 semanas cheias na janela: soma=80h -> qualifica
assertEqual(windows[7].qualifies, true, 'W7: 8 semanas cheias somando 80h >= 48h -> qualifica');
assertEqual(windows[8].qualifies, true, 'W8: janela das ultimas 8 semanas ainda soma >=48h');
// nas primeiras semanas (ainda sem 8 semanas completas) a soma parcial ja pode chegar a 48h
// (W4: semanas W0-W4 = 5 semanas x10h = 50h >= 48h)
assertEqual(windows[4].qualifies, true, 'W4: soma parcial (5 semanas x10h=50h) ja qualifica');
assertEqual(windows[0].qualifies, false, 'W0: so 10h somadas, nao qualifica');

console.log('OK: dl119WeekendWindows() (janela deslizante 8 semanas, Art.5o) — '+CHECKS_RUN+' assercoes.');
`);
