/* =========================================================================
   Harness partilhado pelos testes de regressão (tests/*.test.js).
   Node puro, sem dependências — corre a lógica do index.html num sandbox
   `vm` com um mock mínimo de `document`/`localStorage`, sem abrir browser.

   Uso típico num ficheiro de teste:
     const {loadApp, assert, assertEqual, assertClose} = require('./harness');
     const app = loadApp();
     app.run(`
       document.getElementById('selCategory').value='assistente';
       ...
       assertEqual(currentHourly(), 20.42, 'hourly Assistente/Geral');
     `);

   `app.run(code)` executa `code` no MESMO sandbox onde o index.html já foi
   carregado — por isso vê e pode mutar `UI`, chamar `calculate()`, etc.
   `assert`/`assertEqual`/`assertClose` estão disponíveis DENTRO do sandbox
   (não precisam de require) e lançam exceção ao falhar, que propaga para
   fora de `app.run()` como uma exceção JS normal.
   ========================================================================= */
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const INDEX_HTML_PATH=path.join(__dirname,'..','index.html');

// A 1ª ocorrência de "<script>" no ficheiro está dentro de um comentário de
// documentação no topo (texto literal, não uma tag real) — a tag real do
// motor é sempre a 2ª ocorrência. Ver nota no README dos testes.
function extractAppSource(){
  const html=fs.readFileSync(INDEX_HTML_PATH,'utf8');
  const first=html.indexOf('<script>');
  const start=html.indexOf('<script>', first+1);
  const end=html.indexOf('</script>', start);
  if(start<0 || end<0) throw new Error('Não foi possível localizar o <script> principal em index.html');
  return html.slice(start+'<script>'.length, end);
}

function mkEl(id,value){
  const cls=new Set();
  return {
    id, value: value!==undefined?value:'', checked:false, innerHTML:'', textContent:'',
    style:{}, options:[], disabled:false,
    classList:{
      toggle(c,f){ if(f===undefined){ if(cls.has(c)){cls.delete(c);return false;} cls.add(c);return true;} if(f)cls.add(c);else cls.delete(c);return f;},
      contains(c){return cls.has(c);}, add(c){cls.add(c);}, remove(c){cls.delete(c);}
    },
    addEventListener(){}, appendChild(){}, prepend(){}, remove(){}, click(){},
    querySelectorAll(){return [];}, querySelector(){return mkEl('__a');}
  };
}

function makeLocalStorage(){
  const store={};
  return {
    getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,
    setItem:(k,v)=>{store[k]=String(v);},
    removeItem:k=>{delete store[k];},
    clear:()=>{Object.keys(store).forEach(k=>delete store[k]);},
    _dump:()=>({...store})
  };
}

// assert() lança para dentro do próprio vm — a exceção atravessa
// vm.runInContext normalmente e chega ao try/catch de quem chamou app.run().
// CHECKS_RUN conta quantas verificações passaram (disponível dentro do
// sandbox como uma propriedade viva de `ctx`) — útil para uma linha de
// resumo no fim de cada ficheiro de teste. NOTA: tem de ser instalado com
// Object.defineProperty (não Object.assign/spread), senão o getter é
// avaliado uma única vez e o valor fica estático.
function attachAsserts(ctx){
  let n=0;
  Object.defineProperty(ctx,'CHECKS_RUN',{get:()=>n, enumerable:true});
  ctx.assert=(cond,msg)=>{ if(!cond) throw new Error('ASSERT FALHOU: '+msg); n++; };
  ctx.assertEqual=(actual,expected,label)=>{
    if(actual!==expected) throw new Error(`ASSERT FALHOU (${label}): esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`);
    n++;
  };
  ctx.assertClose=(actual,expected,label,eps)=>{
    eps = eps==null?0.01:eps;
    if(Math.abs(actual-expected)>eps) throw new Error(`ASSERT FALHOU (${label}): esperado ~${expected}, obtido ${actual}`);
    n++;
  };
}

function loadApp(){
  const appSrc=extractAppSource();
  const store={}, qmap={};
  const elFor=(id,v)=>{ if(!store[id]) store[id]=mkEl(id,v); return store[id]; };
  const ctx={
    console,
    document:{
      getElementById:id=>elFor(id),
      querySelector:sel=>{ if(!qmap[sel]) qmap[sel]=mkEl('__q_'+sel); return qmap[sel]; },
      querySelectorAll:()=>[], createElement:()=>mkEl('__e'), body:mkEl('body')
    },
    navigator:{clipboard:{writeText:()=>Promise.resolve()}},
    localStorage:makeLocalStorage(),
    setTimeout, Blob:function(){}, URL:{createObjectURL:()=>'',revokeObjectURL(){}}, FileReader:function(){}
  };
  attachAsserts(ctx);
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(appSrc, ctx);
  // O mock de <select> não interpreta "<option selected>" do innerHTML como
  // um browser real faria — initSelectors() já correu (arranque do próprio
  // index.html) e populou as opções, mas o .value de cada <select> fica ''
  // até ser atribuído explicitamente. Aplica aqui os MESMOS valores por
  // defeito que initSelectors() usa na UI real, para que testes que não
  // mexem nestes campos vejam o comportamento realista (Rotina=7h, Tarde=6h,
  // Alternativo=4h, Bolsa=4h, 40h/semana sem redução) em vez de horas a 0.
  elFor('selWeeklyBase').value='40';
  elFor('selWeeklyRed').value='0';
  elFor('selRotinaH').value='7';
  elFor('selTardeH').value='6';
  elFor('selExtraH').value='4';
  elFor('selBolsaH').value='4';
  return {
    ctx,
    run(code){ return vm.runInContext(code, ctx); }
  };
}

module.exports={ loadApp, extractAppSource, mkEl };
