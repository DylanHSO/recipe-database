'use strict';

const QUICK_TAGS = ['Snel', 'Pasta', 'Aziatisch', 'Vegetarisch', 'Soep', 'Vlees', 'Vis', 'Salade', 'Ontbijt', 'Dessert'];

const SOURCE_LABELS = { youtube: 'YouTube', claude: 'Claude AI', kookboek: 'Kookboek', overig: 'Overig' };

const SETUP_SQL = `CREATE TABLE recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  source_type text DEFAULT 'overig',
  source_url text,
  image_url text,
  cuisine text,
  tags text[] DEFAULT '{}',
  prep_time integer,
  servings integer,
  ingredients text,
  instructions text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON recipes FOR ALL USING (true) WITH CHECK (true);`;

// ---------------------------------------------------------------------------

class RecipeApp {
  constructor() {
    this.db = null;
    this.view = 'home';
    this.params = {};
    this.config = this._loadConfig();
    this._init();
  }

  // ── Config ─────────────────────────────────────────────────────────────────

  _loadConfig() {
    try { return JSON.parse(localStorage.getItem('recipeCfg') || '{}'); }
    catch { return {}; }
  }

  _saveConfig(patch) {
    this.config = { ...this.config, ...patch };
    localStorage.setItem('recipeCfg', JSON.stringify(this.config));
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  _init() {
    if (this.config.supabaseUrl && this.config.supabaseKey) {
      this.db = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);
    }
    document.getElementById('bottomNav').addEventListener('click', e => {
      const btn = e.target.closest('.nav-btn');
      if (btn) this._go(btn.dataset.view);
    });
    window.addEventListener('hashchange', () => this._parseRoute());
    this._parseRoute();
  }

  // ── Router ─────────────────────────────────────────────────────────────────

  _parseRoute() {
    const raw = location.hash.slice(1) || 'home';
    const parts = raw.split('/');
    this.view = parts[0];
    this.params = {};
    for (let i = 1; i < parts.length; i++) {
      const [k, v] = parts[i].split('=');
      if (k) this.params[k] = decodeURIComponent(v || '');
    }
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.view === this.view));
    this._render();
  }

  _go(view, params = {}) {
    const ps = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('/');
    location.hash = view + (ps ? '/' + ps : '');
  }

  _render() {
    const app = document.getElementById('app');
    if (!this.db && this.view !== 'settings') {
      app.innerHTML = this._tplSetup();
      app.querySelector('.btn-primary')?.addEventListener('click', () => this._go('settings'));
      return;
    }
    switch (this.view) {
      case 'home':     app.innerHTML = this._tplHome();    this._bindHome();    break;
      case 'recipes':  this._loadRecipesView();            break;
      case 'add':      app.innerHTML = this._tplAdd();     this._bindAdd();     break;
      case 'detail':   this._loadDetailView();             break;
      case 'settings': app.innerHTML = this._tplSettings(); this._bindSettings(); break;
      default:         app.innerHTML = this._tplHome();    this._bindHome();
    }
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  _tplSetup() {
    return `
      <div class="view-header"><h1>Recepten</h1></div>
      <div class="setup-card">
        <h2>Welkom</h2>
        <p>Verbind eerst met Supabase om je recepten op te slaan en te openen vanaf je telefoon.</p>
        <button class="btn btn-primary">Naar instellingen</button>
      </div>`;
  }

  _tplHome() {
    return `
      <div class="view-header"><h1>Waar heb je zin in?</h1></div>
      <div class="search-container">
        <input class="search-input" id="moodInput" type="text"
               placeholder="bijv. iets pittigs en snel..." autocomplete="off" autocorrect="off">
        <button class="search-btn" id="searchBtn" aria-label="Zoeken">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>
      <div class="quick-tags" id="quickTags">
        ${QUICK_TAGS.map(t => `<button class="quick-tag" data-tag="${t}">${t}</button>`).join('')}
      </div>
      <div id="homeResults"></div>`;
  }

  _tplAdd() {
    return `
      <div class="view-header"><h1>Recept toevoegen</h1></div>
      <div class="import-tabs" id="importTabs">
        <button class="import-tab active" data-tab="link">Link</button>
        <button class="import-tab" data-tab="foto">Foto</button>
        <button class="import-tab" data-tab="tekst">Tekst</button>
        <button class="import-tab" data-tab="handmatig">Handmatig</button>
      </div>
      <div id="importSection">${this._tplLinkImport()}</div>
      <div id="recipeForm" style="display:none">
        <div class="divider"></div>
        <h2 class="mb-16">Recept details</h2>
        ${this._tplRecipeForm()}
        <button class="btn btn-primary" id="saveBtn">Opslaan</button>
        <div style="height:24px"></div>
      </div>`;
  }

  _tplLinkImport() {
    return `
      <div class="form-group">
        <label>YouTube of website URL</label>
        <input type="url" id="linkInput" placeholder="https://youtube.com/watch?v=..." autocorrect="off" autocapitalize="off">
      </div>
      <button class="btn btn-primary" id="importLinkBtn">Importeer link</button>`;
  }

  _tplFotoImport() {
    return `
      <div class="photo-upload" id="photoUpload">
        <p>Tik om een foto te kiezen</p>
        <small>Foto van een kookboekpagina of screenshot</small>
        <input type="file" id="photoFile" accept="image/*" style="display:none">
      </div>
      <div id="photoPreview"></div>
      <button class="btn btn-primary mt-12" id="importPhotoBtn" style="display:none">Verwerk foto met AI</button>
      ${!this.config.netlifyUrl ? `<p style="color:var(--text-muted);font-size:0.8125rem;margin-top:8px;text-align:center">Vereist een Netlify URL in instellingen.</p>` : ''}`;
  }

  _tplTekstImport() {
    return `
      <div class="form-group">
        <label>Plak of beschrijf een recept</label>
        <textarea id="tekstInput" placeholder="Plak hier een recept, of beschrijf wat je wilt maken..." style="min-height:180px"></textarea>
      </div>
      <button class="btn btn-primary" id="importTekstBtn">Verwerk tekst met AI</button>
      ${!this.config.netlifyUrl ? `<p style="color:var(--text-muted);font-size:0.8125rem;margin-top:8px;text-align:center">Vereist een Netlify URL in instellingen.</p>` : ''}`;
  }

  _tplRecipeForm(d = {}) {
    return `
      <div class="form-group">
        <label>Titel *</label>
        <input type="text" id="f_title" value="${this._esc(d.title)}" placeholder="Naam van het recept">
      </div>
      <div class="form-group">
        <label>Bron</label>
        <select id="f_source_type">
          ${['overig','youtube','claude','kookboek'].map(v =>
            `<option value="${v}" ${d.source_type === v ? 'selected' : ''}>${SOURCE_LABELS[v]}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>URL (optioneel)</label>
        <input type="url" id="f_source_url" value="${this._esc(d.source_url)}" placeholder="https://...">
      </div>
      <div class="form-group">
        <label>Afbeelding URL (optioneel)</label>
        <input type="url" id="f_image_url" value="${this._esc(d.image_url)}" placeholder="https://...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Keuken</label>
          <input type="text" id="f_cuisine" value="${this._esc(d.cuisine)}" placeholder="Italiaans">
        </div>
        <div class="form-group">
          <label>Tijd (min)</label>
          <input type="number" id="f_prep_time" value="${d.prep_time || ''}" placeholder="30">
        </div>
      </div>
      <div class="form-group">
        <label>Tags (komma-gescheiden)</label>
        <input type="text" id="f_tags" value="${this._esc(Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || ''))}" placeholder="pasta, snel, vegetarisch">
      </div>
      <div class="form-group">
        <label>Ingrediënten</label>
        <textarea id="f_ingredients" placeholder="- 200g pasta&#10;- 2 tomaten">${this._esc(d.ingredients)}</textarea>
      </div>
      <div class="form-group">
        <label>Bereiding</label>
        <textarea id="f_instructions" placeholder="1. Kook de pasta..." style="min-height:140px">${this._esc(d.instructions)}</textarea>
      </div>
      <div class="form-group">
        <label>Notities</label>
        <textarea id="f_notes" placeholder="Eigen aanpassingen...">${this._esc(d.notes)}</textarea>
      </div>`;
  }

  _tplSettings() {
    return `
      <div class="view-header"><h1>Instellingen</h1></div>
      <div class="settings-section">
        <div class="settings-label">Supabase database</div>
        <div class="form-group">
          <label>Project URL</label>
          <input type="url" id="s_url" value="${this._esc(this.config.supabaseUrl)}" placeholder="https://xxxx.supabase.co" autocapitalize="off" autocorrect="off">
        </div>
        <div class="form-group">
          <label>Anon Key</label>
          <input type="text" id="s_key" value="${this._esc(this.config.supabaseKey)}" placeholder="eyJ..." autocapitalize="off" autocorrect="off">
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-label">AI-functies (optioneel)</div>
        <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:12px">
          Voor foto/tekst-import en "AI helpt me kiezen". Vul in na het deployen op Netlify.
        </p>
        <div class="form-group">
          <label>Netlify site URL</label>
          <input type="url" id="s_netlify" value="${this._esc(this.config.netlifyUrl)}" placeholder="https://jouw-app.netlify.app" autocapitalize="off" autocorrect="off">
        </div>
      </div>
      <button class="btn btn-primary" id="saveSettingsBtn">Opslaan</button>
      <div class="divider"></div>
      <div class="settings-section">
        <div class="settings-label">Supabase database aanmaken</div>
        <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:8px">
          Plak dit eenmalig in de <strong>SQL Editor</strong> van je Supabase project:
        </p>
        <div class="code-block">${SETUP_SQL}</div>
        <button class="btn btn-secondary mt-8" id="copySqlBtn">Kopieer SQL</button>
      </div>`;
  }

  // ── Home / Search ──────────────────────────────────────────────────────────

  _bindHome() {
    const input = document.getElementById('moodInput');
    const go = () => { const q = input.value.trim(); if (q) this._doSearch(q); };
    document.getElementById('searchBtn').addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    document.getElementById('quickTags').addEventListener('click', e => {
      const tag = e.target.closest('.quick-tag');
      if (!tag) return;
      document.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      input.value = tag.dataset.tag;
      this._doSearch(tag.dataset.tag);
    });
  }

  async _doSearch(query) {
    const el = document.getElementById('homeResults');
    el.innerHTML = `<div class="loading-center"><div class="spinner"></div></div>`;
    const recipes = await this._searchRecipes(query);
    if (!recipes.length) {
      el.innerHTML = `<div class="empty-state"><p>Geen recepten gevonden voor <em>"${this._esc(query)}"</em>.</p></div>`;
      return;
    }
    const hasAI = !!this.config.netlifyUrl;
    el.innerHTML = `
      ${hasAI ? `<button class="btn btn-ghost mb-16" id="aiBtn">AI helpt me kiezen (${recipes.length} opties)</button>` : ''}
      <div class="recipe-grid" id="searchGrid">${recipes.map(r => this._tplCard(r)).join('')}</div>`;
    this._bindCards('#searchGrid');
    if (hasAI) {
      document.getElementById('aiBtn').addEventListener('click', () => this._aiSuggest(query, recipes));
    }
  }

  async _searchRecipes(query) {
    if (!this.db) return [];
    const q = query.replace(/[%_\\]/g, '\\$&');
    const { data } = await this.db.from('recipes').select('*')
      .or(`title.ilike.%${q}%,cuisine.ilike.%${q}%,ingredients.ilike.%${q}%,notes.ilike.%${q}%`)
      .limit(24);
    return data || [];
  }

  async _aiSuggest(mood, recipes) {
    const btn = document.getElementById('aiBtn');
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:var(--primary)"></div>&nbsp;AI denkt na...`;
    try {
      const list = recipes.map(r =>
        `ID:${r.id} | ${r.title}${r.cuisine ? ` (${r.cuisine})` : ''}${r.tags?.length ? ` [${r.tags.join(',')}]` : ''}${r.prep_time ? ` | ${r.prep_time}min` : ''}`
      ).join('\n');
      const res = await this._callClaude({
        system: 'Kies het beste recept op basis van de stemming. Antwoord als JSON: {"id":"...","title":"...","reason":"één zin in het Nederlands"}. Geen markdown.',
        messages: [{ role: 'user', content: `Stemming: "${mood}"\n\nRecepten:\n${list}` }],
      });
      const s = JSON.parse(res.content[0].text.replace(/```(?:json)?\n?|\n?```/g, '').trim());
      const found = recipes.find(r => r.id === s.id);
      const resultsEl = document.getElementById('homeResults');
      const grid = resultsEl.querySelector('#searchGrid')?.innerHTML || '';
      resultsEl.innerHTML = `
        <div class="suggestion-card">
          <div class="suggestion-label">AI suggestie</div>
          <div class="suggestion-title">${this._esc(s.title)}</div>
          <div class="suggestion-reason">${this._esc(s.reason)}</div>
          ${found ? `<button class="btn btn-primary btn-sm" id="goSuggestion">Bekijk recept</button>` : ''}
        </div>
        <div class="recipe-grid" id="searchGrid">${grid}</div>`;
      this._bindCards('#searchGrid');
      if (found) document.getElementById('goSuggestion')?.addEventListener('click', () => this._go('detail', { id: found.id }));
    } catch {
      this._toast('AI kon geen suggestie geven');
      btn.disabled = false;
      btn.innerHTML = `AI helpt me kiezen`;
    }
  }

  // ── Recipes list ───────────────────────────────────────────────────────────

  async _loadRecipesView() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="view-header"><h1>Alle recepten</h1></div><div class="loading-center"><div class="spinner"></div></div>`;
    const { data, error } = await this.db.from('recipes').select('*').order('created_at', { ascending: false });
    if (error) { app.innerHTML += `<div class="empty-state"><p>Kon recepten niet laden.</p></div>`; return; }
    const header = `<div class="view-header"><h1>Alle recepten${data.length ? ` (${data.length})` : ''}</h1></div>`;
    app.innerHTML = header + (data.length
      ? `<div class="recipe-grid" id="allGrid">${data.map(r => this._tplCard(r)).join('')}</div>`
      : `<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><p>Nog geen recepten. Voeg er een toe!</p></div>`);
    this._bindCards('#allGrid');
  }

  // ── Detail view ────────────────────────────────────────────────────────────

  async _loadDetailView() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="loading-center" style="padding-top:30vh"><div class="spinner"></div></div>`;
    const { data, error } = await this.db.from('recipes').select('*').eq('id', this.params.id).single();
    if (error || !data) { app.innerHTML = `<div class="empty-state"><p>Recept niet gevonden.</p></div>`; return; }
    app.innerHTML = `
      <button class="back-btn" id="backBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Terug
      </button>
      ${data.image_url ? `<img class="detail-image" src="${this._esc(data.image_url)}" alt="${this._esc(data.title)}" loading="lazy">` : ''}
      <span class="source-badge source-${data.source_type || 'overig'}">${SOURCE_LABELS[data.source_type] || 'Overig'}</span>
      <h1 class="detail-title" style="margin-top:10px">${this._esc(data.title)}</h1>
      <div class="detail-meta">
        ${data.cuisine ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>${this._esc(data.cuisine)}</span>` : ''}
        ${data.prep_time ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${data.prep_time} min</span>` : ''}
        ${data.servings ? `<span>${data.servings} personen</span>` : ''}
      </div>
      ${data.tags?.length ? `<div class="tags">${data.tags.map(t => `<span class="tag">${this._esc(t)}</span>`).join('')}</div>` : ''}
      ${data.source_url ? `<a class="source-link" href="${this._esc(data.source_url)}" target="_blank" rel="noopener">Bekijk origineel <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : ''}
      ${data.ingredients ? `<div class="detail-section"><div class="detail-section-label">Ingrediënten</div><p>${this._esc(data.ingredients)}</p></div>` : ''}
      ${data.instructions ? `<div class="detail-section"><div class="detail-section-label">Bereiding</div><p>${this._esc(data.instructions)}</p></div>` : ''}
      ${data.notes ? `<div class="detail-section"><div class="detail-section-label">Notities</div><p style="color:var(--text-muted)">${this._esc(data.notes)}</p></div>` : ''}
      <div style="margin-top:32px;margin-bottom:8px">
        <button class="btn btn-danger" id="deleteBtn">Recept verwijderen</button>
      </div>
      <div style="height:16px"></div>`;
    document.getElementById('backBtn').addEventListener('click', () => history.back());
    document.getElementById('deleteBtn').addEventListener('click', () => this._deleteRecipe(data.id, data.title));
  }

  async _deleteRecipe(id, title) {
    if (!confirm(`"${title}" verwijderen?`)) return;
    const { error } = await this.db.from('recipes').delete().eq('id', id);
    if (error) { this._toast('Verwijderen mislukt'); return; }
    this._toast('Recept verwijderd');
    this._go('recipes');
  }

  // ── Add / Import ───────────────────────────────────────────────────────────

  _bindAdd() {
    document.getElementById('importTabs').addEventListener('click', e => {
      const tab = e.target.closest('.import-tab');
      if (!tab) return;
      document.querySelectorAll('.import-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const sec = document.getElementById('importSection');
      switch (tab.dataset.tab) {
        case 'link':      sec.innerHTML = this._tplLinkImport();  this._bindLinkImport();  break;
        case 'foto':      sec.innerHTML = this._tplFotoImport();  this._bindFotoImport();  break;
        case 'tekst':     sec.innerHTML = this._tplTekstImport(); this._bindTekstImport(); break;
        case 'handmatig': sec.innerHTML = '';
          this._showForm({});
          break;
      }
    });
    this._bindLinkImport();
  }

  _bindLinkImport() {
    document.getElementById('importLinkBtn')?.addEventListener('click', async () => {
      const url = document.getElementById('linkInput').value.trim();
      if (!url) return;
      this._setBtnLoading('importLinkBtn', true, 'Importeren...');
      try {
        const data = await this._importYouTube(url);
        this._showForm(data);
        this._toast('Gegevens opgehaald');
      } catch {
        this._toast('Kon URL niet importeren');
      } finally {
        this._setBtnLoading('importLinkBtn', false, 'Importeer link');
      }
    });
  }

  _bindFotoImport() {
    const upload = document.getElementById('photoUpload');
    const fileInput = document.getElementById('photoFile');
    const importBtn = document.getElementById('importPhotoBtn');
    upload?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      document.getElementById('photoPreview').innerHTML =
        `<img src="${url}" style="width:100%;border-radius:var(--radius);max-height:220px;object-fit:cover;margin-top:12px">`;
      importBtn.style.display = 'flex';
      importBtn._file = file;
    });
    importBtn?.addEventListener('click', async () => {
      const file = importBtn._file;
      if (!file || !this.config.netlifyUrl) return;
      this._setBtnLoading('importPhotoBtn', true, 'AI verwerkt foto...');
      try {
        const data = await this._importPhoto(file);
        this._showForm({ ...data, source_type: 'kookboek' });
        this._toast('Recept geëxtraheerd');
      } catch {
        this._toast('AI kon de foto niet verwerken');
      } finally {
        this._setBtnLoading('importPhotoBtn', false, 'Verwerk foto met AI');
      }
    });
  }

  _bindTekstImport() {
    document.getElementById('importTekstBtn')?.addEventListener('click', async () => {
      const text = document.getElementById('tekstInput').value.trim();
      if (!text || !this.config.netlifyUrl) return;
      this._setBtnLoading('importTekstBtn', true, 'AI verwerkt tekst...');
      try {
        const data = await this._importText(text);
        this._showForm({ ...data, source_type: 'claude' });
        this._toast('Recept geparsed');
      } catch {
        this._toast('AI kon de tekst niet verwerken');
      } finally {
        this._setBtnLoading('importTekstBtn', false, 'Verwerk tekst met AI');
      }
    });
  }

  _showForm(data) {
    const form = document.getElementById('recipeForm');
    if (!form) return;
    // Re-render form fields with data
    form.innerHTML = `
      <div class="divider"></div>
      <h2 class="mb-16">Recept details</h2>
      ${this._tplRecipeForm(data)}
      <button class="btn btn-primary" id="saveBtn">Opslaan</button>
      <div style="height:24px"></div>`;
    form.style.display = 'block';
    document.getElementById('saveBtn').addEventListener('click', () => this._saveRecipe());
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async _saveRecipe() {
    const title = document.getElementById('f_title').value.trim();
    if (!title) { this._toast('Voer een titel in'); return; }
    const tags = document.getElementById('f_tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      title,
      source_type: document.getElementById('f_source_type').value,
      source_url:  document.getElementById('f_source_url').value.trim() || null,
      image_url:   document.getElementById('f_image_url').value.trim() || null,
      cuisine:     document.getElementById('f_cuisine').value.trim() || null,
      prep_time:   parseInt(document.getElementById('f_prep_time').value) || null,
      tags,
      ingredients: document.getElementById('f_ingredients').value.trim() || null,
      instructions:document.getElementById('f_instructions').value.trim() || null,
      notes:       document.getElementById('f_notes').value.trim() || null,
    };
    this._setBtnLoading('saveBtn', true, 'Opslaan...');
    const { data, error } = await this.db.from('recipes').insert(payload).select().single();
    if (error) {
      this._toast('Opslaan mislukt');
      this._setBtnLoading('saveBtn', false, 'Opslaan');
      return;
    }
    this._toast('Recept opgeslagen!');
    this._go('detail', { id: data.id });
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  _bindSettings() {
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      const url     = document.getElementById('s_url').value.trim();
      const key     = document.getElementById('s_key').value.trim();
      const netlify = document.getElementById('s_netlify').value.trim();
      this._saveConfig({ supabaseUrl: url, supabaseKey: key, netlifyUrl: netlify });
      if (url && key) this.db = supabase.createClient(url, key);
      this._toast('Instellingen opgeslagen');
    });
    document.getElementById('copySqlBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(SETUP_SQL)
        .then(() => this._toast('SQL gekopieerd!'))
        .catch(() => this._toast('Kopiëren mislukt'));
    });
  }

  // ── Import logic ───────────────────────────────────────────────────────────

  async _importYouTube(url) {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) throw new Error('oEmbed failed');
    const d = await res.json();
    const videoId = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([^&?/\s]{6,})/)?.[1];
    return {
      title: d.title,
      source_type: 'youtube',
      source_url: url,
      image_url: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    };
  }

  async _importPhoto(file) {
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const result = await this._callClaude({
      system: 'Extraheer het recept uit de foto. Antwoord als JSON (geen markdown): {"title":"","cuisine":"","prep_time":null,"servings":null,"tags":[],"ingredients":"","instructions":""}. Gebruik null voor ontbrekende velden.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
          { type: 'text', text: 'Extraheer het recept als JSON.' },
        ],
      }],
    });
    return JSON.parse(result.content[0].text.replace(/```(?:json)?\n?|\n?```/g, '').trim());
  }

  async _importText(text) {
    const result = await this._callClaude({
      system: 'Parseer het recept. Antwoord als JSON (geen markdown): {"title":"","cuisine":"","prep_time":null,"servings":null,"tags":[],"ingredients":"","instructions":""}. Gebruik null voor ontbrekende velden.',
      messages: [{ role: 'user', content: `Parseer dit recept:\n\n${text}` }],
    });
    return JSON.parse(result.content[0].text.replace(/```(?:json)?\n?|\n?```/g, '').trim());
  }

  async _callClaude(payload) {
    const base = this.config.netlifyUrl || location.origin;
    const res = await fetch(`${base}/.netlify/functions/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Claude error ${res.status}`);
    return res.json();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _tplCard(r) {
    const thumb = r.image_url
      ? `<img class="recipe-card-thumb" src="${this._esc(r.image_url)}" alt="${this._esc(r.title)}" loading="lazy">`
      : `<div class="recipe-card-thumb-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`;
    const meta = [r.cuisine, r.prep_time ? `${r.prep_time} min` : null].filter(Boolean).join(' · ');
    const tags = r.tags?.slice(0, 2).map(t => `<span class="tag">${this._esc(t)}</span>`).join('') || '';
    return `
      <div class="recipe-card" data-id="${r.id}">
        ${thumb}
        <div class="recipe-card-body">
          <div class="recipe-card-title">${this._esc(r.title)}</div>
          ${meta ? `<div class="recipe-card-meta">${meta}</div>` : ''}
          ${tags ? `<div class="tags" style="margin-top:6px">${tags}</div>` : ''}
        </div>
      </div>`;
  }

  _bindCards(selector) {
    document.querySelectorAll(`${selector} .recipe-card`).forEach(card =>
      card.addEventListener('click', () => this._go('detail', { id: card.dataset.id })));
  }

  _setBtnLoading(id, loading, label) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<div class="spinner" style="width:16px;height:16px;border-width:2px"></div>&nbsp;${label}`
      : label;
  }

  _toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Start
const app = new RecipeApp();
