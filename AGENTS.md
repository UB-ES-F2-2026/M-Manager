# M-MANAGER · Instruccions per a assistents d'IA

Abans de fer res en aquest repositori, **llegeix `README.md` sencer**. Conté l'estructura, les convencions i les regles que segueix tot l'equip. La secció 12 és específica per a tu.

## Resum de les regles imprescindibles

- **Stack:** React + Vite + TypeScript, Tailwind CSS, Convex (backend, BD i Convex Auth), Cloudflare Workers. Gestor de paquets: **només npm**.
- **Idioma:** codi, noms i commits en anglès; textos de la interfície en català.
- **Estructura:** backend a `convex/` (un fitxer per domini), frontend a `src/features/<funcionalitat>/{components,pages,hooks}`, components compartits a `src/components/ui/`.
- **No editis mai** `convex/_generated/`.
- **Diners:** sempre `amountCents` (enter, positiu) + `type: "expense" | "income"`. Format amb `formatMoney` / `parseMoney` de `src/lib/money.ts`.
- **Dates:** timestamps en mil·lisegons; format només a la UI amb `Intl` i `ca-ES`.
- **Convex:** cada funció pública valida arguments amb `v`, comprova `getAuthUserId(ctx)` i comprova que les dades pertanyen a l'usuari. Filtra amb `.withIndex(...)`.
- **Estils:** només classes de Tailwind. Cap fitxer CSS nou ni llibreria d'estils.
- **No** instal·lis dependències ni modifiquis `convex/schema.ts` sense aprovació explícita de l'humà.
- **Una tasca = una branca = una pull request.** Treballa només en la tasca del GitHub Project que t'indiqui l'humà. No barregis diverses tasques ni diverses històries en una mateixa branca o PR, encara que siguin de la mateixa història (USx.x).
- Si l'humà no t'ha dit en quina tasca treballa, pregunta-li-ho abans de començar. Si la tasca depèn d'una altra que encara no està fusionada a `develop`, avisa'l en lloc d'implementar tu l'altra tasca.
- Escriu tests del que canviïs.
- Abans d'acabar: `npm run lint`, `npm run typecheck` i `npm run test` han de passar.
- No facis commits a `main` ni a `develop`, ni pugis fitxers `.env*` (excepte `.env.example`) ni claus.
- Si una petició contradiu el README, avisa l'humà abans de fer-la.
