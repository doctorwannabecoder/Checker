# Verificador de ER / TN

Ferramenta autónoma (um único ficheiro `index.html`) para o trabalhador
**conferir se as horas de ER (Escala de Recurso) e TN (Trabalho Noturno)
foram corretamente pagas** num determinado mês.

Corre 100% no navegador — sem servidor, sem base de dados, sem login.
Basta abrir o `index.html`.

## Como usar

1. Abrir `index.html` (duplo-clique) ou publicar via **GitHub Pages**
   (Settings → Pages → branch `main`) e abrir o link.
2. Escolher **mês/ano** e o **tempo de trabalho semanal contratado** (30–45 h).
3. Inserir o plano mensal de uma de duas formas:
   - **Colar (3 partes)** — os dados vêm de 3 sítios diferentes, por isso há
     três caixas, coladas uma a uma:
     - **Parte 1 — escala-base:** `nome + 1 código por dia`. O **1.º código é o
       último dia do mês anterior**; seguem-se os dias do mês. Códigos de
       folga/descanso/férias (`D`, `F`, `Fr`) não contam como trabalho.
     - **Parte 2 — turnos ER** (esparso).
     - **Parte 3 — prevenções** (esparso).
   - **Inserção manual** — marcar por dia: RW / ER / Prev + início/fim/horas.
4. Clicar **Analisar e montar grelha**, corrigir a grelha por dia se preciso.
5. Clicar **Calcular pagamento**.

### O problema dos espaços em branco (Partes 2/3)

Como o plano vem de **texto/PDF (só espaços, sem tabulações)**, as Partes 2/3
têm dias em branco e **não alinham por posição**. Solução adotada:

> **Prefixe cada entrada com o número do dia**, ex.: `3 20:00-08:00` ou
> `12 24h`. Assim o alinhamento é exato, independentemente dos brancos.

A Parte 1 (que tem um código para *todos* os dias) serve de “régua” e tudo
acaba numa **grelha editável** onde pode corrigir manualmente antes de calcular.

### Semana completa

Para os cálculos semanais de ER/TN, a app **estende cada semana de fronteira**
do mês a Seg–Dom. Dias úteis sem turno/folga são pré-preenchidos como
**Trabalho Regular (RW)**. Os dias fora do mês contam só para a validação
semanal — não entram no resumo mensal.

### Saídas

- **Output 1 — Resumo mensal por código de pagamento:** horas pagas por
  código, com horas ER e TN associadas, para comparar com o recibo.
- **Output 2 — Detalhe por turno ER:** cada turno mostra início/fim, total
  ER, TN dentro do turno, repartição diurno/noturno e por código de pagamento.

Botões para **copiar**, exportar **CSV** e **imprimir**.

## ⚠️ Regras de pagamento — precisam de confirmação

O projeto de origem (gerador de escalas) **não define códigos nem regras de
pagamento**. Por isso, todas as regras salariais estão reunidas num único
objeto editável, `PAYROLL_RULES`, no topo do `<script>` em `index.html`, e
estão assinaladas na interface como **«Precisa de confirmação»**.

### Códigos de pagamento

**Fornecidos e confirmados** (em `PAYROLL_RULES.codes`):

| Código | Significado |
|--------|-------------|
| `101.001` | **Remuneração base** (trabalho regular contratado / RW) |
| `700.001` | ER · dia útil · diurno · **1ª hora** |
| `700.002` | ER · dia útil · diurno · **horas seguintes** |
| `700.003` | ER · dia útil · **noturno · 1ª hora** |
| `700.004` | ER · dia útil · **noturno · seguintes** |
| `700.006` | ER · **Sáb > 13h (DDC)** · diurno · seguintes |
| `700.009` | ER · **Domingo (DDS)** · diurno · 1ª hora |
| `700.010` | ER · Domingo (DDS) · diurno · seguintes |
| `211.001` | **TN** · dia útil · noturno *(sigla `OE` por confirmar)* |

Regra **1ª / Seguintes**: a **1ª hora** de cada turno ER bilha sob o código
`…1ª`; as restantes horas sob o código `…Seg`. (`firstHourMinutes = 60`.)

**Em falta** (a app calcula e marca a vermelho **«EM FALTA»** — falta o número
do código real): ER **Sábado 1ª hora**, ER **Sábado noturno**, ER **Domingo
noturno**, **todos** os de **feriado**, TN de Sáb/Dom/feriado, e o código de
**Prevenção**.

**Suposições** a confirmar com o RH / acordo coletivo:

| Regra | Suposição atual |
|-------|-----------------|
| Janela legal de Trabalho Noturno (TN) | 22:00 – 07:00 |
| Sábado conta como DDC a partir de | 13:00 |
| Janela diurna de referência | 08:00 – 20:00 (reutilizada do gerador) |
| Base diária (RW) | horas semanais ÷ 5 |
| Tetos (validação) | 24 h/dia, 48 h/semana |
| Significado dos códigos de escala | `D`=descanso, `F`=folga, `Fr`=férias; `M256`/`T13`/`Bc`/`Cgs` por confirmar |

## Como atualizar os códigos / regras

Editar **apenas** o topo do `<script>` em `index.html`:

- **Códigos do recibo** → `PAYROLL_RULES.codes`: corrija `code`, e ponha
  `missing:false` / `confirm:false` à medida que confirma.
- **Que código se aplica a cada caso** (dia útil/Sáb/Dom/feriado × diurno/noturno
  × 1ª/seguintes) → matriz `CODE_MATRIX` (e `TN_MATRIX` para o TN).
- **Códigos da escala-base** (`M256`, `T13`, …) → `SHIFT_CODE_MAP` (defina
  `worked` e, para turnos, `start`/`end`).
- **Janela de noturno / Sábado / 1ª hora / limites** → campos próprios em
  `PAYROLL_RULES`.

A interface e o motor de cálculo leem tudo a partir daí — nada está
hard-coded noutro sítio.

## Lógica reutilizada

A lógica de datas, feriados portugueses e janelas de turno foi reutilizada
verbatim do gerador de escalas original
([scheduler](https://github.com/doctorwannabecoder/scheduler)):
`iso`, `parseISO`, `addDays`, `easterSunday`, `holidaysForYear`,
`isHoliday`, `holidayName`, `dayKind`, `isoWeekKey`, a tabela de feriados
fixos e as janelas dia 08–20 / noite 20–08 / 24h 08–08 / prevenção.
