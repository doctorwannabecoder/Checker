# Verificador de ER / TN

**▶ Aplicação online: https://doctorwannabecoder.github.io/Checker/**

Ferramenta autónoma (um único ficheiro `index.html`) para o trabalhador
**conferir se as horas de ER (Escala de Recurso) e TN (Trabalho Noturno)
foram corretamente pagas** num determinado período.

Corre 100% no navegador — sem servidor, sem base de dados, sem login, sem
instalação. Basta abrir o `index.html`.

## Como usar

A aplicação está organizada em quatro pontos:

1. **Ponto 1 · Contrato** — categoria profissional (Assistente, Assistente
   Graduado, Assistente Graduado Sénior, Internato Médico Anos 1-3 e Anos 4-6),
   regime e tempo de trabalho semanal. Daqui saem os valores/hora da tabela SIM.
2. **Ponto 2 · Período** — **mês inicial** + **nº de meses** + ano (ver abaixo).
   O défice de horas transitado está atrás de um interruptor, porque na maioria
   dos períodos não há nenhum.
3. **Ponto 3 · Incentivo excecional DL 119/2026** — opcional, ligado por
   interruptor. Só aparece o resto do ponto quando está ativo.
4. **Ponto 4 · Entrada** — inserção manual num **calendário** (semanas na
   horizontal, Segunda a Domingo). Cada dia tem duas linhas:
   - **Trabalho normal**, com as opções que se aplicam ao dia: nos dias úteis
     `R` Rotina · `T` Tarde · `F` Folga · `BH` Bolsa de Horas; ao fim de semana
     apenas `A` Alternativo.
   - **Urgência**: `D` Dia (08:00–20:00) · `N` Noite (20:00–08:00) · `D+N` = 24h.
     Ao fim de semana junta-se `P` **Prevenção** (20:00–08:00), que acumula com
     `D` — são janelas distintas — mas não com `N` nem com 24h.

Depois, **Calcular pagamento**.

### Período

O período é sempre **mês inicial + nº de meses**, mais os dias das semanas de
fronteira nas duas pontas. Não há modos separados.

O nº de meses tem um **teto que impede o período de atravessar para Janeiro do
ano seguinte**: começando em Agosto o máximo é 5 (Ago–Dez), em Dezembro é 1.
Assim os subsídios de férias/Natal e o limite anual do DL 119/2026 ficam sempre
dentro do mesmo ano civil.

**Janeiro + 12 meses** é o ano civil completo — o único caso em que o teto o
permite. Nesse caso o défice deixa de se aplicar (não há período anterior de
onde transitar), as horas ER prévias do DL 119 são ignoradas, e o Output 2
(detalhe por turno) é escondido por ser impraticável ao longo de um ano.

### Semana completa

Para os cálculos semanais de ER/TN, a app **estende cada semana de fronteira**
do período a Seg–Dom. Dias úteis sem turno ou descanso são pré-preenchidos como
Rotina; feriados em dia útil como Folga; fins de semana ficam em branco (já são
dia de descanso). Os dias fora do período contam só para a validação semanal.

## Saídas

- **Output 1 — Resumo por categoria de pagamento:** uma linha por categoria com
  horas, **coeficiente** e €/hora (o valor base da tabela SIM) — a linha lê-se
  `Horas × Coef. × €/hora = Valor`. A linha Base é um vencimento mensal, por isso
  não mostra horas. Fecha com **uma única linha de total**, que mostra base, extra
  e a soma em colunas próprias. O suplemento de Dedicação Plena tem linha própria
  quando aplicável.
- **Output 2 — Horas por turno ER:** a primeira coluna identifica o turno (com
  **intervalo de datas** quando atravessa a meia-noite) e leva o total do turno;
  as linhas repartem-no **por dia** — células agrupadas — e por categoria, pela
  ordem TN → 1ª hora → seguintes. As descrições e coeficientes saem das linhas
  para uma **legenda comum** por baixo da tabela. Ex.: uma noite de 5–6 sem
  contrato por cumprir dá `1ª hora` 1h e `seguintes` 3h no dia 5, e `seguintes`
  8h no dia 6.
- **Output 3 — Estimativa anual de rendimento**, incluindo subsídios de férias e
  de Natal proporcionais.

## Categorias por nome, não por número de código

Esta ferramenta **não usa os números de código do recibo** (700.001, 211.001,
etc.). Cada categoria de pagamento tem apenas um **nome** — por exemplo
`DU · Diu · 1ª hora` — que chega para fazer a correspondência visual com o
recibo pelas horas e pelo valor. Evita ter de manter um mapa de números de
código sempre atualizado.

## DL 119/2026 — incentivo excecional

Quando ligado, o Ponto 3 avalia as horas ER acima do limite legal anual
(**250h** em Dedicação Plena, **150h** nos restantes regimes) e paga-as em
**blocos de 48h**, com requalificação, estorno de ER e incentivo por bloco
integrados diretamente nas linhas do Output 1 — o total do Output 1 é a figura
equivalente ao recibo.

Se o período inserido não cobrir o ano todo, indique as **horas ER já feitas até
ao final do mês anterior**, para o limite anual ser avaliado corretamente.

Dois pontos dependem da sua situação e aparecem marcados com **«confirmar»**:

- se esta escala é o **último bloco autorizado** do ano civil (pagamento
  proporcional das horas restantes abaixo de 48h — Art.4º/4);
- se houve pelo menos **48h de banco ao fim de semana nas últimas 8 semanas**
  (condição de majoração, Art.5º).

## Onde ficam as regras

Tudo no topo do `<script>` em `index.html` — a UI e o motor de cálculo leem
daqui, nada está hard-coded noutro sítio:

| Objeto | Contém |
|--------|--------|
| `PAYROLL_RULES` | janela de TN (20:00–08:00), corte de Sábado (13:00), duração da «1ª hora» (60 min), janela e fator da Prevenção, e as categorias de pagamento |
| `CODE_MATRIX` / `TN_MATRIX` | que categoria se aplica a cada caso (dia útil/Sáb/Dom/feriado × diurno/noturno × 1ª/seguintes) |
| `SHIFT_CODE_MAP` | significado dos códigos da escala-base (`worked` e, para turnos, `start`/`end`) |

As regras de pagamento estão **confirmadas** contra a tabela SIM, com uma exceção
assinalada na UI com badge amarelo: a **Prevenção**. Não o fator (metade do turno),
mas a atribuição por dia — a janela 20:00–08:00 atravessa sempre dois dias e cada
hora é paga pelo multiplicador do dia REAL em que cai, como a SIM faz para os
turnos trabalhados. Consequência: prevenção ao Sábado ≈ ×1,24 (4h Sáb + 8h Dom) e
ao Domingo ≈ ×1,07 (4h Dom + 8h Seg, já a dia útil). A leitura alternativa seria
pagar as 12h ao dia em que começa. **Por confirmar com o acordo coletivo.**

Qualquer entrada com `confirm:true` mostra o badge amarelo — use isso ao introduzir
qualquer regra ainda por validar.

## Guardar, exportar e importar

O que se preenche fica guardado no proprio navegador (localStorage) e reaparece no
arranque seguinte, com um banner a perguntar se quer repor.

Os botoes **Exportar dados** / **Importar dados** (topo da pagina) gravam e leem um
ficheiro `.json` com tudo: contrato, periodo e **todos os dias ja preenchidos** —
incluindo os de meses fora do periodo atual. Serve para continuar noutro
computador, para guardar uma copia, ou para retomar mais tarde.

Mudar o mes inicial ou o numero de meses **nao apaga** o que ja estava preenchido:
os dias tocados sao guardados a parte e voltam a aparecer quando o periodo os
incluir outra vez. Os dias nunca tocados mantem o pre-preenchimento normal.

## Continuar mes a mes

O ficheiro exportado guarda **todos os dias ja preenchidos**, mesmo os de meses
fora do periodo atual. Ao **importar**, a app salta para o **mes a seguir ao ultimo
preenchido** e seleciona 1 mes — e so continuar a preencher.

Os meses anteriores nao ficam so guardados: sao **recalculados** e usados para

- o **defice de horas** que transita para o periodo selecionado (o campo passa a
  estar preenchido e bloqueado, com a nota de que vem do historico);
- as **horas Extra ja feitas** no ano, para o limite do DL 119/2026;
- a tabela **"Ja ganho antes deste periodo"**, no separador anual, que mostra o
  historico, o periodo selecionado e o **acumulado**.

Isto e o que faz com que preencher mes a mes de o **mesmo total** que preencher o
periodo todo de uma vez. Sem o defice herdado, cada mes recomecava do zero e o
total do ano ficava inflacionado.

> Como o historico e recalculado a partir dos dias (e nao de um total gravado),
> corrigir um dia antigo corrige o ano inteiro. Em contrapartida, todos os meses
> sao calculados com o contrato **atual** — se houver uma promocao a meio do ano,
> os meses antigos passam a ser recalculados ao vencimento novo.

## Testes

```
node tests/run-all.js            # suite completa, sai com código 1 se algo falhar
node tests/algum-teste.test.js   # um ficheiro só, output mais detalhado
```

Node puro, **sem dependências e sem `npm install`**. O `tests/harness.js` extrai
o `<script>` principal do `index.html` e corre-o num sandbox `vm` com um mock
mínimo de `document`/`localStorage`. 18 ficheiros de teste.

**Correr a suite antes de cada push** — esta ferramenta existe para acertar
números de vencimento; um valor errado em silêncio anula-lhe o propósito.

## Lógica reutilizada

A lógica de datas, feriados portugueses e janelas de turno foi reutilizada
verbatim do gerador de escalas original
([scheduler](https://github.com/doctorwannabecoder/scheduler)):
`iso`, `parseISO`, `addDays`, `easterSunday`, `holidaysForYear`, `isHoliday`,
`holidayName`, `dayKind`, `isoWeekKey` e `PT_HOLIDAYS_FIXED`.
