# Testes de regressão

Suite de testes Node puro (sem dependências, sem browser) para a lógica de
cálculo do `index.html`. Corre a lógica do ficheiro num sandbox `vm` com um
mock mínimo de `document`/`localStorage`.

## Correr

```
node tests/run-all.js       # corre tudo, imprime resumo, sai com código 1 se algo falhar
node tests/algum-teste.test.js   # corre um ficheiro individual (mais detalhe no output)
```

Não há instalação nem `npm install` a fazer — é só Node.

## Como funciona

`tests/harness.js` extrai o `<script>` principal de `../index.html` (a
segunda ocorrência de `<script>` no ficheiro — a primeira é texto literal
dentro de um comentário de documentação no topo, não uma tag real) e corre-o
num contexto `vm` isolado. Cada `*.test.js` chama:

```js
const {loadApp} = require('./harness');
const app = loadApp();
app.run(`
  document.getElementById('selCategory').value='assistente';
  ...
  assertEqual(currentHourly(), 20.42, 'hourly Assistente/Geral');
`);
```

`app.run(code)` executa `code` no MESMO sandbox onde o `index.html` já foi
carregado — por isso o código dentro do template string vê e pode chamar
todas as funções do motor (`calculate()`, `computeDL119()`, `UI`, etc.)
diretamente, sem imports.

`assert(cond, msg)` / `assertEqual(actual, expected, label)` /
`assertClose(actual, expected, label, eps)` estão disponíveis DENTRO do
sandbox (não precisam de require) e lançam uma exceção ao falhar — essa
exceção propaga normalmente para fora de `app.run()`, por isso o Node sai
com código de erro e mostra a asserção que falhou.

## Armadilhas conhecidas do mock (importante ao escrever novos testes)

- **`<select>` não reflete `<option selected>`**: ao contrário de um browser
  real, o mock não interpreta o `innerHTML` gerado por `initSelectors()`. Por
  isso `loadApp()` já aplica os MESMOS valores por defeito que a UI real usa
  (Rotina=7h, Tarde=6h, Alternativo=4h, Bolsa=4h, 40h/semana sem redução)
  logo a seguir a carregar a app — mas se um teste muda de categoria/regime a
  meio, os outros campos (`selWeeklyBase`, `selRotinaH`, etc.) continuam a
  precisar de ser bons desde o início; não assumas que `.value` reflete
  `<option selected>` nalguma outra select criada manualmente num teste.
- **Blocos DL119 são pagamento atómico**: se um bloco de 48h fecha neste
  período mas parte das horas de excesso vieram de um período anterior que
  nunca tinha fechado um bloco, o bloco inteiro (48h) conta como "novo" — não
  há rateio parcial entre períodos. Já apanhámos este engano ao escrever os
  testes (ver `dl119_incremental_blocks.test.js`).
- **Bloco final incompleto só entra com `isLastBlock:true`**: sem isso,
  excesso que não fecha um bloco de 48h fica simplesmente de fora (não
  aparece, não é pago) até fechar num período futuro.

## Organização

- `harness.js` — mock de DOM/localStorage + `loadApp()`/`assert*()`. Não é um teste, é infraestrutura partilhada.
- `dl119_*.test.js` — motor do Decreto-Lei 119/2026 (tabelas, blocos, janela deslizante de 8 semanas, clawback cronológico, projeção do Output 3).
- `period_*.test.js` — os 3 modos de período (Mensal/Anual/Variável) e o cálculo de vencimento base + subsídios.
- `persistence.test.js` — guardar/restaurar estado em `localStorage`.
- Os restantes cobrem o motor de cálculo geral (turnos de fronteira, toggles de trabalho/banco, ausência de tetos de horas, etc.).

## Porquê isto existe

Estes testes viveram durante muito tempo só numa pasta temporária fora do
repositório — perdiam-se entre sessões e não havia forma de os re-correr sem
os reescrever do zero. Ficam aqui, versionados, precisamente para isso não
voltar a acontecer.
