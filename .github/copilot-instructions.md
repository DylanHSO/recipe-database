# GitHub Copilot – Receptendatabase Werkwijze

## Stack
- **React 19** + **Vite 6** + **TypeScript** (strict)
- **Tailwind CSS 3** (utility classes + CSS custom properties in `src/index.css`)
- **react-router-dom 7** met `HashRouter` (hash-based routing)
- **@supabase/supabase-js** voor de database
- **Netlify Functions** (CommonJS) als proxy voor Anthropic API
- Alle gebruikersinterface-tekst is in het **Nederlands**

## Projectstructuur
```
src/
  main.tsx          # Entry point
  App.tsx           # Router + AppProvider
  index.css         # Tailwind directives + alle CSS
  context/
    AppContext.tsx   # config, db (Supabase), showToast
  lib/
    types.ts        # Recipe, AppConfig, SourceType
    claude.ts       # callClaude(), suggestRecipe()
    imports.ts      # importYouTube(), importText(), importPhoto()
  components/
    BottomNav.tsx   # Navigatie (verborgen op cooking-view)
    RecipeCard.tsx  # Kaartje in het grid
    SourceBadge.tsx # Badge per brontype
    Spinner.tsx     # Laad-indicator
  views/
    HomeView.tsx    # Zoeken + quick tags + AI-suggestie
    RecipesView.tsx # Alle recepten
    AddView.tsx     # Import tabs + formulier
    DetailView.tsx  # Recept detail + verwijderen
    CookingView.tsx # Kookmodus met AI-chat
    SettingsView.tsx# Supabase + Netlify configuratie
netlify/
  functions/
    claude.js       # Serverless proxy (CommonJS, niet aanpassen)
```

## Backlog-item oppakken

Wanneer de gebruiker vraagt om een backlog-item op te pakken, doorloop je **altijd** deze volledige cyclus:

### Stap 1 · Analyseer het backlog-item
Lees `backlog.md` en het bijbehorende GitHub Issue. Bepaal:
- Welke bestanden moeten worden aangemaakt of gewijzigd
- Of er nieuwe Supabase-kolommen nodig zijn (vermeld dit expliciet)
- Of er nieuwe types in `src/lib/types.ts` nodig zijn

### Stap 2 · Feature branch aanmaken
```bash
git checkout main
git pull
git checkout -b feature/<naam-van-feature>
```

Naamgevingsconventies:
- `feature/<naam>` – nieuwe functionaliteit
- `fix/<naam>` – bugfixes
- `refactor/<naam>` – herstructurering zonder functiewijziging
- `chore/<naam>` – onderhoud, afhankelijkheden, configuratie

### Stap 3 · Implementeer de code
- Wijzig of maak alleen de bestanden die nodig zijn
- Gebruik TypeScript strict mode — geen `any` tenzij onvermijdelijk
- Gebruik bestaande CSS-klassen uit `src/index.css` en Tailwind utilities
- Alle tekst in het Nederlands
- Geen `dangerouslySetInnerHTML` gebruiken
- Controleer altijd of `db` niet `null` is voor Supabase-aanroepen

### Stap 4 · Valideer de build
```bash
npm run build
```
Zorg dat de build slaagt zonder TypeScript-errors voor je commit.

### Stap 5 · Commit en push
```bash
git add -A
git commit -m "feat(<scope>): <beschrijving in het Nederlands>"
git push -u origin feature/<naam>
```

Commit-berichtenconventie (Conventional Commits):
- `feat(recipes): voeg filterfunctie toe op bereidingstijd`
- `fix(cooking): herstel scroll naar onderste chatbericht`
- `refactor(context): vereenvoudig config-opslag`
- `chore(deps): update supabase-js naar v2.50`

### Stap 6 · Pull Request aanmaken
```bash
gh pr create \
  --title "feat(<scope>): <beschrijving>" \
  --body "Sluit #<issue-nummer>" \
  --base main
```

### Stap 7 · Instructies voor de gebruiker
Sluit altijd af met een **Validatie-instructie** in dit formaat:

---
**Hoe je dit kunt testen:**
1. Zorg dat je op de feature branch zit: `git checkout feature/<naam>`
2. Start de dev-server: `npm run dev`
3. Open de app in de browser op `http://localhost:5173`
4. [Concrete stappen specifiek voor de feature, bijv.: "Ga naar een recept → klik op het hartje → ververs de pagina → het hartje is nog steeds gevuld"]
5. [Eventuele Supabase-stappen als er schema-wijzigingen zijn]
---

Meld ook altijd als er **handmatige stappen** nodig zijn (bijv. een SQL-migratie uitvoeren in Supabase).

---

## Coderingconventies

- **Context**: Gebruik `useApp()` voor `config`, `db`, `showToast`
- **Routing**: `useNavigate()` en `useParams()` uit react-router-dom
- **Supabase**: Altijd `db` checken op `null` voor gebruik
- **Foutmeldingen**: Vang fouten op met try/catch, toon via `showToast()`
- **Styling**: Voorkeur voor bestaande CSS-klassen; voeg nieuwe toe aan `src/index.css`
- **Types**: Definieer types in `src/lib/types.ts`
