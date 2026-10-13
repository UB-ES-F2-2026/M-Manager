# M-MANAGER · Instruccions inicials per a la IA

Aquest fitxer és el punt d'entrada per a qualsevol assistent d'IA que facis servir en aquest projecte (Claude, ChatGPT, Gemini, Copilot, Cursor, Codex...).

## Si la IA treballa dins del repositori

(Claude Code, Cursor, Copilot, Codex, Gemini CLI...)

Abans de demanar-li res, digues-li:

> Llegeix `README.md` i `AGENTS.md` sencers i segueix-ne totes les regles en aquesta conversa.

## Si la IA és un xat web que no veu el repositori

(ChatGPT, Claude.ai, Gemini...)

Comença la conversa enganxant-li el contingut de `AGENTS.md` i, si la tasca és gran, també el de `README.md`, amb aquest missatge:

> Treballo al projecte M-MANAGER. A continuació tens les regles del projecte. Segueix-les en tot el codi que em proposis i avisa'm si alguna cosa que et demano les contradiu.

## Digues-li sempre en quina tasca treballes

Cada tasca del GitHub Project té la seva pròpia branca i la seva pròpia pull request. En començar, indica a la IA la tasca concreta, per exemple:

> Treballo en la tasca `[US1.1] Create registration screen`. Fes només aquesta tasca, en una branca pròpia, sense tocar res d'altres tasques.

## On són les regles

- `README.md`: estructura, convencions i flux de treball complets. La secció 12 és específica per a la IA.
- `AGENTS.md`: resum de les regles imprescindibles.
