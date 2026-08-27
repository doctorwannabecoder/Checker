# Checker — Verificador de ER / TN

Browser tool for a worker to verify that ER (Escala de Recurso) and TN (Trabalho
Noturno) hours were correctly paid for a given period. Live at
https://doctorwannabecoder.github.io/Checker/ (GitHub Pages serves `main`).

## Shape

Single self-contained `index.html` — no build step, no dependencies, no server,
no login. Everything runs client-side. Open the file and it works.

Do not introduce a bundler, framework, or package.json for the app itself. The
single-file property is deliberate: the user opens it locally or via Pages.

## Where the rules live

All payroll rules are at the top of the main `<script>`:

- `PAYROLL_RULES` — night window, Saturday DDC cutoff, first-hour minutes, limits
- `CODE_MATRIX` / `TN_MATRIX` — which category applies per day-kind x day/night x first/subsequent
- `SHIFT_CODE_MAP` — meaning of base-roster codes; `worked`, plus `start`/`end` for shifts
- SIM pay scales by position (`assistente`, `graduado`, `senior`, `ife1`, `ife2`) and regime

Nothing is hard-coded elsewhere — the UI and calculation engine read from these.
Change rules there, not at the call sites.

## Tests

```
node tests/run-all.js          # full suite, exits 1 on failure
node tests/some.test.js        # single file, more verbose
```

Pure Node, zero dependencies, no `npm install`. `tests/harness.js` extracts the
main `<script>` from `index.html` and runs it in a `vm` sandbox with a minimal
`document`/`localStorage` mock.

**Run the suite before every push.** This tool exists to get payroll numbers
right; a silently wrong figure defeats its entire purpose.

## State model

`UI.entries` (date -> {work, banco, prev}) is the source of truth for everything the
user has filled in, and it outlives the visible period. `buildCalendar()` rebuilds
rows from the prefill and then overlays `UI.entries`, which is what stops a period
change from wiping entered days.

**Any code that mutates `row.work` / `row.banco` / `row.prev` must call
`rememberDay(date)`**, or the change is lost on the next rebuild. The same object is
what gets saved to localStorage and exported to file.

## Conventions

- UI text and commit messages: Portuguese for user-facing strings, English is fine for commits
- Uncertain payroll rules are surfaced in the UI as "precisa de confirmação" badges — keep that pattern for anything unverified against the collective agreement
- Keep full precision in calculations; round only at display time
- Date/holiday logic was reused verbatim from the `scheduler` repo — keep it in sync rather than diverging

## Environment note

Node is at `C:\Program Files\nodejs` but may not be on the inherited PATH:

```
export PATH="$PATH:/c/Program Files/nodejs"
```
