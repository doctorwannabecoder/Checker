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
  horas, €/hora (o valor base da tabela SIM), **coeficiente** e valor — a linha
  lê-se `Horas × €/hora × Coef. = Valor`. A descrição e a nota de cada categoria
  partilham a mesma coluna. Fecha com **uma única linha de total**, que mostra
  base, extra e a soma em colunas próprias. O suplemento de Dedicação Plena tem
  linha própria quando aplicável.
- **Output 2 — Horas por turno ER:** uma tabela onde a primeira coluna identifica
  o turno (com **intervalo de datas** quando atravessa a meia-noite) e as linhas
  seguintes repartem-no **por dia** e por categoria. Uma coluna comum mostra a
  descrição e o coeficiente. Ex.: uma noite de 5–6 sem contrato por cumprir dá
  `1ª hora` 1h e `seguintes` 3h no dia 5, e `seguintes` 8h no dia 6.
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

As regras de pagamento estão **confirmadas** contra a tabela SIM. Uma entrada com
`confirm:true` passa a mostrar um badge amarelo na UI — use isso ao introduzir
qualquer regra ainda por validar.

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
