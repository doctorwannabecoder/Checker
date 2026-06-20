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
   - **Inserção manual** — marcar, por dia: RW (trabalho regular), ER, TN,
     sobreposição, tipo de turno, início/fim e/ou horas.
   - **Colar plano mensal** — colar o texto; o parser tenta reconhecer
     data, tipo de turno e horas, e mostra uma pré-visualização editável.
4. Clicar **Calcular pagamento**.

### Saídas

- **Output 1 — Resumo mensal por código de pagamento:** horas pagas por
  código, com horas ER e TN associadas, para comparar com o recibo.
- **Output 2 — Detalhe por turno ER:** cada turno mostra início/fim, total
  ER, TN dentro do turno, horas regulares, e a repartição por código.

Botões para **copiar**, exportar **CSV** e **imprimir**.

## ⚠️ Regras de pagamento — precisam de confirmação

O projeto de origem (gerador de escalas) **não define códigos nem regras de
pagamento**. Por isso, todas as regras salariais estão reunidas num único
objeto editável, `PAYROLL_RULES`, no topo do `<script>` em `index.html`, e
estão assinaladas na interface como **«Precisa de confirmação»**.

São **suposições** até serem confirmadas com o RH / acordo coletivo:

| Regra | Suposição atual |
|-------|-----------------|
| Janela legal de Trabalho Noturno (TN) | 22:00 – 07:00 |
| Janela diurna de referência | 08:00 – 20:00 (reutilizada do gerador) |
| Códigos de pagamento | `ER-DD`, `ER-DN`, `ER-FD`, `ER-FN`, `TN`, `RW` (placeholders) |
| Base diária | horas semanais ÷ 5 |
| Tetos (validação) | 24 h/dia, 48 h/semana |

## Como atualizar os códigos / regras

Editar **apenas** o objeto `PAYROLL_RULES` em `index.html`:

- Códigos do recibo → `PAYROLL_RULES.codes` (alterar `code`; pôr
  `needsConfirmation:false` depois de confirmado).
- Janela de noturno → `PAYROLL_RULES.nightWindow`.
- Limites diários/semanais → `PAYROLL_RULES.limits`.

A interface e o motor de cálculo leem tudo a partir daí — nada está
hard-coded noutro sítio.

## Lógica reutilizada

A lógica de datas, feriados portugueses e janelas de turno foi reutilizada
verbatim do gerador de escalas original
([scheduler](https://github.com/doctorwannabecoder/scheduler)):
`iso`, `parseISO`, `addDays`, `easterSunday`, `holidaysForYear`,
`isHoliday`, `holidayName`, `dayKind`, `isoWeekKey`, a tabela de feriados
fixos e as janelas dia 08–20 / noite 20–08 / 24h 08–08 / prevenção.
