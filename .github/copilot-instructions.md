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

## Workflow voor nieuwe features

Wanneer je een feature implementeert, voer je **altijd** deze stappen uit:

### 1. Feature branch aanmaken
```bash
git checkout main
git pull
git checkout -b feature/<naam-van-feature>
```

Gebruik deze naamgevingsconventies:
- `feature/<naam>` – nieuwe functionaliteit
- `fix/<naam>` – bugfixes
- `refactor/<naam>` – herstructurering zonder functiewijziging
- `chore/<naam>` – onderhoud, afhankelijkheden, configuratie

### 2. Implementeer de code
- Wijzig of maak alleen de bestanden die nodig zijn
- Gebruik TypeScript strict mode — geen `any` tenzij onvermijdelijk
- Gebruik bestaande CSS-klassen uit `src/index.css` en Tailwind utilities
- Alle tekst in het Nederlands
- Geen `dangerouslySetInnerHTML` gebruiken

### 3. Commit en push
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

### 4. Pull Request aanmaken
```bash
gh pr create \
  --title "feat(<scope>): <beschrijving>" \
  --body "Sluit #<issue-nummer>" \
  --base main
```

## Conventions

- **Context**: Gebruik `useApp()` voor `config`, `db`, `showToast`
- **Routing**: `useNavigate()` en `useParams()` uit react-router-dom
- **Supabase**: Altijd `db` checken op `null` voor gebruik
- **Foutmeldingen**: Vang fouten op met try/catch, toon via `showToast()`
- **Styling**: Voorkeur voor bestaande CSS-klassen; voeg nieuwe toe aan `src/index.css`
- **Types**: Definieer types in `src/lib/types.ts`
