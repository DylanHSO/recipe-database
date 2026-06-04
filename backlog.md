# Backlog – Receptendatabase

Prioriteit: 🔴 Hoog · 🟡 Normaal · 🟢 Laag

---

## 🔴 Hoog

### #2 · Recept bewerken vanuit detailpagina
**Branch:** `feature/recept-bewerken`
**GitHub:** https://github.com/DylanHSO/recipe-database/issues/2

Gebruiker kan een bestaand recept bewerken via de detailpagina. Het bewerkformulier is vooraf ingevuld met de huidige waarden.

**Acceptatiecriteria**
- [ ] Bewerkknop zichtbaar op de detailpagina
- [ ] Formulier is vooraf ingevuld met huidige waarden
- [ ] Na opslaan keert de gebruiker terug naar de detailpagina
- [ ] Wijzigingen worden opgeslagen in Supabase

---

### #8 · Favorieten markeren
**Branch:** `feature/favorieten`
**GitHub:** https://github.com/DylanHSO/recipe-database/issues/8

Gebruiker kan recepten als favoriet markeren. Een hartje-icoon is zichtbaar op kaart en detailpagina.

**Acceptatiecriteria**
- [ ] Hartje-icoon op kaart en detailpagina
- [ ] Favorieten worden opgeslagen in Supabase (`is_favorite` kolom)
- [ ] Filter op favorietenweergave op de receptenpagina

---

## 🟡 Normaal

### #4 · Boodschappenlijst genereren vanuit recept
**Branch:** `feature/boodschappenlijst`
**GitHub:** https://github.com/DylanHSO/recipe-database/issues/4

Met één klik een boodschappenlijst aanmaken vanuit een recept. Deelbaar via de Web Share API.

**Acceptatiecriteria**
- [ ] Knop op detailpagina om lijst te genereren
- [ ] Ingrediënten worden geparsed naar afzonderlijke items
- [ ] Lijst is deelbaar via de Web Share API
- [ ] Meerdere recepten kunnen samengevoegd worden

---

### #9 · Recepten importeren vanuit URL (algemeen)
**Branch:** `feature/url-import`
**GitHub:** https://github.com/DylanHSO/recipe-database/issues/9

Gebruiker kan een willekeurige URL plakken (niet alleen YouTube). Claude extraheert de receptinformatie van de pagina.

**Acceptatiecriteria**
- [ ] URL-import werkt voor gangbare kookwebsites
- [ ] Claude extraheert titel, ingrediënten en stappen
- [ ] Gebruiker kan het geïmporteerde recept nog bewerken

---

### #10 · Portiegrootte aanpassen in kookmodus
**Branch:** `feature/portiegrootte`
**GitHub:** https://github.com/DylanHSO/recipe-database/issues/10

In de kookmodus kan de gebruiker het aantal personen aanpassen. Ingrediënthoeveelheden worden automatisch herberekend.

**Acceptatiecriteria**
- [ ] Spinner of input voor aantal personen in kookmodus
- [ ] Hoeveelheden worden herberekend via Claude of regex
- [ ] Originele waarden blijven bewaard

---

## 🟢 Laag

### #3 · Maaltijdplanner: recepten inplannen per dag
**Branch:** `feature/maaltijdplanner`
**GitHub:** https://github.com/DylanHSO/recipe-database/issues/3

Weekoverzicht waarbij de gebruiker recepten kan inplannen per dag. Boodschappenlijst genereren vanuit de planning.

**Acceptatiecriteria**
- [ ] Weekoverzicht met 7 dagen zichtbaar
- [ ] Recept toewijzen aan een dag via zoeken
- [ ] Boodschappenlijst genereren vanuit de weekplanning
- [ ] Planning wordt lokaal opgeslagen

---

## ✅ Gedaan

### Migratie naar React + Vite + TypeScript + Tailwind
Volledig heropgebouwd als gestructureerde React-app. Zie [PR #1](https://github.com/DylanHSO/recipe-database/pull/1).
