# M-MANAGER

App de finances personals inspirada en Margen: control de moviments, pressupostos, patrimoni i despeses compartides amb amics.

Projecte del **Grup F2** de l'assignatura d'Enginyeria del Software (Universitat de Barcelona, curs 2026-27), desenvolupat amb Scrum.

> **Llegeix aquest document sencer abans de tocar codi.** Totes les persones de l'equip, i qualsevol assistent d'IA que facin servir, han de seguir els mateixos criteris. Si alguna cosa d'aquí no et quadra, proposa el canvi a l'equip; no el facis pel teu compte.

---

## Índex

1. [Equip](#1-equip)
2. [Stack tecnològic](#2-stack-tecnològic)
3. [Posada en marxa en local](#3-posada-en-marxa-en-local)
4. [Estructura de carpetes](#4-estructura-de-carpetes)
5. [Convencions de codi](#5-convencions-de-codi)
6. [Diners i dates: regles d'or](#6-diners-i-dates-regles-dor)
7. [Backend amb Convex](#7-backend-amb-convex)
8. [Branques, commits i pull requests](#8-branques-commits-i-pull-requests)
9. [Tests i Definition of Done](#9-tests-i-definition-of-done)
10. [Desplegament](#10-desplegament)
11. [Organització: Trello i GitHub Projects](#11-organització-trello-i-github-projects)
12. [Instruccions per a assistents d'IA](#12-instruccions-per-a-assistents-dia)

---

## 1. Equip

| Nom | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|---|
| Lluc | DevOps · **Scrum Master** | | | |
| Zakaria | QA · **Product Owner** | | | |
| Marti | Backend | | | |
| Nelson | Backend | | | |
| Ayoub | Frontend | | | |
| Joel | Frontend | | | |

Els rols es revisen a l'inici de cada sprint i s'actualitza aquesta taula. Cada persona ha de fer **almenys dos rols tècnics diferents** al llarg del projecte. Els rols de Scrum Master i Product Owner són a temps parcial: qui els fa també té un rol tècnic.

Repositori: [github.com/UB-ES-F2-2026/M-Manager](https://github.com/UB-ES-F2-2026/M-Manager)

---

## 2. Stack tecnològic

| Peça | Tecnologia | Per a què |
|---|---|---|
| Frontend | React + Vite + TypeScript | Interfície de l'app (SPA) |
| Estils | Tailwind CSS | Tots els estils, sense fitxers CSS propis |
| Rutes | React Router | Navegació entre pantalles |
| Backend i base de dades | Convex | Dades, lògica de negoci, temps real i tasques programades |
| Autenticació | Convex Auth (`@convex-dev/auth`) | Registre i login (US1.1, US1.2) |
| Hosting | Cloudflare Workers (static assets) | Servir el frontend |
| Tests | Vitest + `convex-test` | Tests del frontend i de les funcions de Convex |
| Gestor de paquets | npm | **Només npm.** No feu servir pnpm, yarn ni bun |

No s'afegeixen llibreries noves sense comentar-ho abans a l'equip.

---

## 3. Posada en marxa en local

### Requisits

- Node.js 20 o superior
- Git
- Un compte a [Convex](https://convex.dev) amb invitació a l'equip del projecte (demana-la a qui fa de DevOps)

### Passos

```bash
# 1. Clona el repositori i entra a la carpeta
git clone https://github.com/UB-ES-F2-2026/M-Manager.git
cd M-Manager

# 2. Instal·la les dependències
npm install

# 3. Arrenca Convex (terminal 1)
npx convex dev
```

La primera vegada, `npx convex dev` et demanarà iniciar sessió i triar el projecte. Et crearà **la teva pròpia base de dades de desenvolupament** i el fitxer `.env.local` amb la variable `VITE_CONVEX_URL`. Deixa aquesta terminal oberta: va sincronitzant els canvis de la carpeta `convex/`.

```bash
# 4. Arrenca el frontend (terminal 2)
npm run dev
```

Obre l'adreça que surt a la terminal (normalment `http://localhost:5173`).

### Scripts disponibles

| Ordre | Què fa |
|---|---|
| `npm run dev` | Arrenca el frontend en local |
| `npm run build` | Compila el frontend a `dist/` |
| `npm run test` | Executa tots els tests |
| `npm run lint` | Revisa l'estil del codi (ESLint) |
| `npm run typecheck` | Comprova els tipus de TypeScript |

Abans d'obrir una pull request, `lint`, `typecheck` i `test` han de passar sense errors.

---

## 4. Estructura de carpetes

```
/
├── convex/                    # BACKEND (Convex)
│   ├── _generated/            # Generat automàticament. NO EDITAR MAI
│   ├── schema.ts              # Esquema de la base de dades (font de veritat)
│   ├── auth.ts                # Configuració de Convex Auth
│   ├── auth.config.ts
│   ├── http.ts                # Rutes HTTP que necessita Convex Auth
│   ├── crons.ts               # Tasques programades (moviments recurrents)
│   ├── users.ts               # Funcions d'usuari
│   ├── transactions.ts        # Moviments (US2.1–US2.4)
│   ├── recurring.ts           # Moviments recurrents i propers pagaments (US2.5)
│   ├── budgets.ts             # Pressupostos (US3.1)
│   ├── netWorth.ts            # Actius, deutes i patrimoni (US3.2, US3.3)
│   ├── groups.ts              # Grups i despeses compartides (US4.1–US4.3)
│   └── lib/                   # Ajudes compartides del backend (auth, diners...)
│
├── src/                       # FRONTEND (React)
│   ├── main.tsx               # Punt d'entrada
│   ├── App.tsx                # Definició de rutes
│   ├── index.css              # Únic fitxer CSS: directives de Tailwind
│   ├── components/
│   │   ├── ui/                # Components reutilitzables (Button, Input, Card...)
│   │   └── layout/            # Estructura comuna (barra de navegació inferior...)
│   ├── features/              # Una carpeta per funcionalitat (= èpica del Trello)
│   │   ├── auth/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── net-worth/
│   │   └── groups/
│   └── lib/                   # Utilitats del frontend (format de diners, dates...)
│
├── docs/
│   └── wireframes/            # Dissenys de les pantalles (els mateixos del Trello)
├── public/                    # Fitxers estàtics (icones, favicon)
├── .env.example               # Plantilla de variables d'entorn (sí que es puja)
├── .env.local                 # Les teves variables (NO es puja mai)
├── wrangler.jsonc             # Configuració de Cloudflare Workers
├── AGENTS.md                  # Instruccions per a assistents d'IA
├── INSTRUCCIONS_IA.md         # Com començar a treballar amb qualsevol IA
└── README.md                  # Aquest document
```

### Dins de cada carpeta de `src/features/`

```
features/transactions/
├── components/      # Components només d'aquesta funcionalitat (TransactionForm.tsx...)
├── pages/           # Pantalles senceres, una per ruta (TransactionsPage.tsx...)
└── hooks/           # Hooks propis (useMonthlySavings.ts...)
```

Regla: si un component només el fa servir una funcionalitat, va dins de la seva carpeta. Si el fan servir dues o més, es mou a `src/components/ui/`.

### Relació entre carpetes i backlog

| Carpeta frontend | Fitxer backend | Etiqueta Trello | Històries |
|---|---|---|---|
| `features/auth` | `auth.ts`, `users.ts` | Autenticació / Usuari | US1.1, US1.2 |
| `features/transactions` | `transactions.ts`, `recurring.ts` | Transaccions | US2.1–US2.5 |
| `features/budgets` | `budgets.ts` | Anàlisi i Patrimoni | US3.1 |
| `features/net-worth` | `netWorth.ts` | Anàlisi i Patrimoni | US3.2, US3.3 |
| `features/groups` | `groups.ts` | Mòdul Social | US4.1–US4.3 |

---

## 5. Convencions de codi

### Idioma

- **Codi en anglès:** noms de variables, funcions, components, fitxers, taules i camps de la base de dades, comentaris i missatges de commit.
- **Textos de la interfície en català:** tot el que veu l'usuari (botons, títols, errors).
- **Documentació en català:** aquest README i la documentació de `docs/`.

### Noms

| Element | Format | Exemple |
|---|---|---|
| Components React | PascalCase | `TransactionForm.tsx` |
| Pàgines | PascalCase acabat en `Page` | `TransactionsPage.tsx` |
| Hooks | camelCase amb `use` | `useMonthlySavings.ts` |
| Altres fitxers TS | camelCase | `formatMoney.ts` |
| Fitxers de Convex | camelCase | `netWorth.ts` |
| Carpetes de `features/` | kebab-case | `net-worth/` |
| Taules de Convex | camelCase, en plural | `transactions`, `groupExpenses` |
| Constants | UPPER_SNAKE_CASE | `MAX_BUDGET_ALERT` |

### TypeScript

- Mode `strict` activat. **Prohibit `any`**: si no saps el tipus, fes servir `unknown` i comprova'l.
- Els tipus de les dades surten de Convex (`Doc<"transactions">`, `Id<"groups">`). No els dupliquis a mà.

### React

- Només components funcionals i hooks.
- Components petits: si un passa de ~150 línies, divideix-lo.
- Les dades es llegeixen amb `useQuery` i s'escriuen amb `useMutation` de Convex, mai amb `fetch`.

### Estils (Tailwind)

- Tots els estils amb classes de Tailwind. No es creen fitxers `.css` nous ni s'escriu `style={{...}}` excepte per a valors dinàmics (per exemple, l'amplada d'una barra de progrés).
- Si una combinació de classes es repeteix, es converteix en un component de `components/ui/`.
- Els colors i mides es defineixen a la configuració de Tailwind, no amb valors arbitraris (`bg-[#123456]`) escampats pel codi.

---

## 6. Diners i dates: regles d'or

Som una app de finances. Aquestes regles **no es poden saltar**:

1. **Els imports es guarden sempre en cèntims i com a enters.** 12,50 € es guarda com `1250`. Mai decimals: `0.1 + 0.2` no dona `0.3` en JavaScript.
2. **El camp es diu sempre `amountCents`**, perquè ningú dubti de la unitat.
3. **Els imports són sempre positius.** Si és despesa o ingrés ho diu el camp `type: "expense" | "income"`, no el signe.
4. **Per mostrar un import, fes servir sempre `formatMoney(cents)`** de `src/lib/money.ts`. Per convertir el que escriu l'usuari, `parseMoney(text)`. Ningú formata diners a mà.
5. **Les dates es guarden com a timestamp en mil·lisegons** (`number`, `Date.now()`). Es formaten només a la interfície, amb `Intl` i el locale `ca-ES`.
6. **Els totals (estalvi del mes, patrimoni net, balanços de grup) es calculen al backend**, dins d'una query de Convex, no sumant llistes al frontend.

---

## 7. Backend amb Convex

### Tipus de funció

| Tipus | Quan es fa servir |
|---|---|
| `query` | Llegir dades. Es reactiva sola: la pantalla s'actualitza quan canvien les dades |
| `mutation` | Escriure dades (crear, editar, esborrar) |
| `action` | Només per cridar serveis externs. De moment no en necessitem |
| `internalQuery` / `internalMutation` | Funcions que no pot cridar el frontend (per exemple, les que executa `crons.ts`) |

### Regles obligatòries per a cada funció pública

1. **Valida els arguments** amb `v` (`args: { amountCents: v.number(), ... }`).
2. **Comprova que l'usuari ha iniciat sessió** amb `getAuthUserId(ctx)`. Si retorna `null`, llança un error.
3. **Comprova que les dades són seves.** Un usuari només pot llegir i modificar els seus moviments, pressupostos i actius. En els grups, només els membres del grup hi tenen accés.
4. **Fes servir índexs** (`.withIndex(...)`) per filtrar, no `.filter(...)` sobre taules senceres. Els índexs es declaren a `schema.ts`.

Les comprovacions 2 i 3 es fan amb les funcions d'ajuda de `convex/lib/`, no copiant codi a cada fitxer.

### L'esquema (`schema.ts`)

- És la font de veritat de les dades. Cada taula té un comentari que explica per a què serveix.
- Qualsevol canvi a `schema.ts` va en una pull request pròpia i l'ha de revisar algú de backend, perquè afecta tothom.

### Moviments recurrents (US2.5)

`crons.ts` executa un cop al dia una `internalMutation` de `recurring.ts` que crea els moviments que toquen aquell dia.

---

## 8. Branques, commits i pull requests

### Branques

```
main      ──●──────────────────────●──  (estable: el que s'ensenya a la demo)
             \                    /
develop       ●────●────────●────●       (integració durant el sprint)
                    \      /
feature/US2.1-...    ●──●─●
```

| Branca | Per a què | Qui hi fusiona |
|---|---|---|
| `main` | Versió estable i desplegada. És la de la demo | Només al final de cada sprint, des de `develop` |
| `develop` | Integració de la feina del sprint | Pull requests revisades |
| `feature/USx.x-descripcio-curta` | Una branca per història o tasca, creada des de `develop` | — |
| `fix/descripcio-curta` | Arreglar un bug | — |

Exemples: `feature/US2.1-add-transaction`, `fix/negative-savings-color`.

**Ningú fa push directament a `main` ni a `develop`.** Tot entra per pull request.

### Commits

Petits i amb el codi de la història al davant, en anglès:

```
US2.1: add transaction form
US2.1: validate amount is greater than zero
fix: savings card shows wrong month
chore: update dependencies
```

### Pull requests

1. Obre-la sempre **cap a `develop`**.
2. Títol: `[US2.1] Add transaction form`.
3. A la descripció, posa `Closes #12` (el número de la tasca del GitHub Project) perquè es tanqui sola en fusionar.
4. Si toca la interfície, afegeix una captura de pantalla.
5. Necessita **almenys una aprovació** d'un company (preferiblement qui fa de QA) i que el CI passi.
6. Després de fusionar, esborra la branca.

### Flux de cada dia

```bash
git checkout develop
git pull
git checkout -b feature/US2.1-add-transaction
# ... programes i fas commits ...
git push -u origin feature/US2.1-add-transaction
# obre la pull request a GitHub cap a develop
```

---

## 9. Tests i Definition of Done

### Tests

- Fitxers de test al costat del codi que proven: `money.ts` → `money.test.ts`.
- Les funcions de Convex es proven amb `convex-test`.
- Cada criteri d'acceptació d'una història hauria de tenir almenys un test que el comprovi.
- El CI executa `lint`, `typecheck` i `test` a cada pull request. Si falla, no es fusiona.

### Definition of Done

Una història només es mou a **Done** del Trello quan compleix **totes** aquestes condicions:

1. Tot el codi està fusionat a `develop`.
2. Tots els tests passen.
3. Tots els criteris d'acceptació de la targeta del Trello es compleixen i estan marcats.
4. La documentació o els textos d'ajuda necessaris estan escrits.
5. El Product Owner l'ha acceptada.

---

## 10. Desplegament

El desplegament el gestiona la persona de DevOps. La resta de l'equip no ha de tocar les claus.

| Entorn | Branca | Convex | Cloudflare |
|---|---|---|---|
| Desenvolupament | La teva branca local | La teva base de dades personal (`npx convex dev`) | — (localhost) |
| Producció | `main` | Desplegament de producció | Worker de producció (enllaç de la demo) |

- El desplegament es fa automàticament des del CI de GitHub en fusionar a `main`: primer `npx convex deploy --cmd "npm run build"` (desplega el backend i compila el frontend apuntant a producció) i després `npx wrangler deploy` (puja `dist/` a Cloudflare).
- Les claus (`CONVEX_DEPLOY_KEY`, `CLOUDFLARE_API_TOKEN`) es guarden com a *secrets* de GitHub. **Mai al codi ni en un commit.**
- `wrangler.jsonc` serveix la carpeta `dist/` com a static assets, configurada en mode SPA perquè les rutes de React Router funcionin en recarregar la pàgina.

---

## 11. Organització: Trello i GitHub Projects

| Eina | Què hi va |
|---|---|
| **Trello** | El Product Backlog: només **user stories**, amb descripció (COM A / VULL / PER AIXÍ), criteris d'acceptació, story points, etiqueta d'èpica i el disseny de la pantalla adjunt |
| **GitHub Projects** | Les **tasques tècniques** que surten de cada user story durant la planificació del sprint. Títol amb el codi de la història: `[US2.1] Create transactions table` |
| **`docs/wireframes/`** | Els dissenys de les pantalles, amb el mateix nom que la història: `US2.1-add-transaction.png` |

---

## 12. Instruccions per a assistents d'IA

Aquesta secció és per a qualsevol IA que treballi en aquest repositori (Claude Code, Cursor, Copilot, Codex, ChatGPT...). Si fas servir una IA, segueix primer els passos de `INSTRUCCIONS_IA.md` perquè llegeixi aquest README.

**Regles per a la IA:**

1. Llegeix aquest README sencer abans de proposar o fer cap canvi, i segueix-ne l'estructura i les convencions.
2. Respecta l'estructura de carpetes de la secció 4. No creïs carpetes noves a l'arrel ni a `src/` sense que l'humà ho demani.
3. **No editis mai `convex/_generated/`.**
4. Codi i commits en anglès; textos de la interfície en català.
5. Compleix sempre les regles de diners i dates de la secció 6: `amountCents` enters, imports positius amb `type`, `formatMoney` / `parseMoney`, timestamps en mil·lisegons.
6. Cada funció pública de Convex valida arguments, comprova l'autenticació i comprova que les dades són de l'usuari (secció 7).
7. Només Tailwind per als estils. No afegeixis llibreries d'estils ni fitxers CSS.
8. **No instal·lis dependències noves** sense que l'humà ho aprovi explícitament. Si en necessites una, digues quina i per què.
9. **No modifiquis `schema.ts`** si la tasca no ho requereix. Si cal, avisa'n clarament, perquè afecta tot l'equip.
10. Fes canvis petits i centrats en la història o tasca que s'està treballant. No refactoritzis codi d'altres funcionalitats pel teu compte.
11. Escriu o actualitza els tests del que canviïs.
12. Abans de donar la feina per acabada, comprova que `npm run lint`, `npm run typecheck` i `npm run test` passen.
13. No facis commits a `main` ni a `develop`, ni pugis fitxers `.env*` (excepte `.env.example`) ni claus.
14. Si una petició de l'humà contradiu aquest README, avisa'l abans de fer-la.
