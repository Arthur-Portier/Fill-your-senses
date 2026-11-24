(() => {
  'use strict';

  const STORAGE_KEY = 'feel-your-senses:v1';
  const TYPES = {
    film:  { label: 'Film',      plural: 'Films',      color: 'var(--film)',  grad: ['#ff8a4c', '#c2255c'] },
    serie: { label: 'Série',     plural: 'Séries',     color: 'var(--serie)', grad: ['#845ef7', '#3b5bdb'] },
    jeu:   { label: 'Jeu vidéo', plural: 'Jeux vidéo', color: 'var(--jeu)',   grad: ['#22b8cf', '#2b8a3e'] },
  };
  const STATUS = {
    done:     { film: 'Vu',       serie: 'Vue',      jeu: 'Terminé' },
    progress: { film: 'En cours', serie: 'En cours', jeu: 'En cours' },
    wish:     { film: 'Envie',    serie: 'Envie',    jeu: 'Envie' },
  };

  // ---------- Storage ----------
  let items = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data.map(normalize).filter(Boolean) : [];
    } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch { toast('Impossible de sauvegarder dans ce navigateur'); }
  }
  function normalize(it) {
    if (!it || typeof it.title !== 'string' || !it.title.trim()) return null;
    const rating = Number(it.rating);
    return {
      id: String(it.id || uid()),
      type: TYPES[it.type] ? it.type : 'film',
      title: it.title.trim().slice(0, 140),
      year: it.year ? Number(it.year) || null : null,
      status: STATUS[it.status] ? it.status : 'done',
      rating: rating >= 1 && rating <= 10 ? Math.round(rating) : null,
      comment: typeof it.comment === 'string' ? it.comment.slice(0, 5000) : '',
      date: typeof it.date === 'string' ? it.date : '',
      fav: !!it.fav,
      poster: typeof it.poster === 'string' && /^https?:\/\//i.test(it.poster) ? it.poster : '',
      createdAt: Number(it.createdAt) || Date.now(),
      updatedAt: Number(it.updatedAt) || Date.now(),
    };
  }
  function uid() {
    return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  }

  // ---------- State ----------
  const state = { type: 'all', status: 'all', sort: 'recent', q: '' };

  // ---------- DOM ----------
  const $ = (s) => document.querySelector(s);
  const grid = $('#grid'), empty = $('#empty'), stats = $('#stats');
  const dialog = $('#dialog'), form = $('#form'), F = form.elements;
  const starsEl = $('#stars'), ratingOut = $('#ratingOut');
  let editingId = null;

  // ---------- Rendering ----------
  function render() {
    renderStats();
    const q = norm(state.q);
    let list = items.filter((it) =>
      (state.type === 'all' || it.type === state.type) &&
      (state.status === 'all' || it.status === state.status) &&
      (!q || norm(it.title).includes(q) || norm(it.comment).includes(q))
    );
    list.sort(sorters[state.sort]);

    grid.replaceChildren(...list.map(card));
    if (list.length) { empty.hidden = true; return; }
    empty.hidden = false;
    empty.textContent = items.length
      ? 'Rien ne correspond à ta recherche.'
      : 'Ta collection est vide. Ajoute ton premier film, ta première série ou ton premier jeu avec « + Ajouter ».';
  }

  const sorters = {
    recent: (a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt,
    rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title, 'fr'),
    title:  (a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }),
    year:   (a, b) => (b.year ?? -1) - (a.year ?? -1) || a.title.localeCompare(b.title, 'fr'),
  };

  function renderStats() {
    const count = (t) => items.filter((i) => i.type === t).length;
    const rated = items.filter((i) => i.rating);
    const avg = rated.length ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1).replace('.', ',') : '—';
    stats.innerHTML = '';
    [
      [count('film'), 'films', TYPES.film.color],
      [count('serie'), 'séries', TYPES.serie.color],
      [count('jeu'), 'jeux vidéo', TYPES.jeu.color],
      [avg, 'note moyenne', 'var(--gold)'],
    ].forEach(([v, l, c]) => {
      const d = el('div', 'stat');
      const b = el('b'); b.textContent = v;
      const s = el('small'); s.innerHTML = `<span class="dot" style="background:${c}"></span>`; s.append(l);
      d.append(b, s); stats.append(d);
    });
  }

  function card(it) {
    const t = TYPES[it.type];
    const c = el('button', 'card');
    c.type = 'button';
    c.setAttribute('aria-label', `${it.title}, ${t.label}${it.rating ? `, noté ${it.rating} sur 10` : ''}`);
    c.addEventListener('click', () => openForm(it.id));

    const p = el('div', 'poster');
    const ph = el('div', 'ph');
    ph.style.background = `linear-gradient(150deg, ${t.grad[0]}, ${t.grad[1]})`;
    ph.textContent = it.title;
    p.append(ph);
    if (it.poster) {
      const img = new Image();
      img.loading = 'lazy'; img.alt = ''; img.referrerPolicy = 'no-referrer';
      img.src = it.poster;
      img.onload = () => { ph.remove(); };
      img.onerror = () => img.remove();
      img.style.position = 'relative';
      p.append(img);
    }
    const badge = el('span', 'badge'); badge.textContent = t.label; p.append(badge);
    if (it.fav) { const f = el('span', 'fav'); f.textContent = '♥'; f.title = 'Coup de cœur'; p.append(f); }
    if (it.rating) { const s = el('span', 'score'); s.textContent = it.rating; p.append(s); }

    const body = el('div', 'card-body');
    const title = el('div', 'card-title'); title.textContent = it.title;
    const meta = el('div', 'meta');
    meta.textContent = [it.year, STATUS[it.status][it.type], it.date && formatDate(it.date)].filter(Boolean).join(' · ');
    body.append(title, meta);
    if (it.comment) { const cm = el('p', 'comment'); cm.textContent = `« ${it.comment} »`; body.append(cm); }

    c.append(p, body);
    return c;
  }

  // ---------- Form ----------
  function buildStars() {
    for (let i = 1; i <= 10; i++) {
      const b = el('button');
      b.type = 'button'; b.textContent = '★'; b.dataset.v = i;
      b.setAttribute('role', 'radio'); b.setAttribute('aria-label', `${i} sur 10`);
      b.addEventListener('click', () => setRating(i));
      b.addEventListener('mouseenter', () => paintStars(i));
      starsEl.append(b);
    }
    const clear = el('button', 'clear'); clear.type = 'button'; clear.textContent = 'Effacer';
    clear.addEventListener('click', () => setRating(null));
    starsEl.append(clear);
    starsEl.addEventListener('mouseleave', () => paintStars(Number(F.rating.value) || 0));
  }
  function setRating(v) {
    F.rating.value = v || '';
    ratingOut.textContent = v ? `${v}/10` : '—';
    paintStars(v || 0);
  }
  function paintStars(v) {
    starsEl.querySelectorAll('button[data-v]').forEach((b) => {
      const on = Number(b.dataset.v) <= v;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(Number(b.dataset.v) === v));
    });
  }

  function openForm(id = null) {
    editingId = id;
    const it = id ? items.find((i) => i.id === id) : null;
    form.reset();
    $('#dlgTitle').textContent = it ? 'Modifier' : 'Ajouter';
    $('#deleteBtn').hidden = !it;
    const preset = state.type !== 'all' ? state.type : 'film';
    form.querySelector(`input[name=type][value="${it ? it.type : preset}"]`).checked = true;
    F.title.value = it?.title || '';
    F.year.value = it?.year || '';
    F.status.value = it?.status || 'done';
    F.comment.value = it?.comment || '';
    F.date.value = it?.date || (it ? '' : today());
    F.fav.checked = !!it?.fav;
    F.poster.value = it?.poster || '';
    setRating(it?.rating || null);
    updateStatusLabels();
    dialog.showModal();
    if (!it) F.title.focus();
  }

  function updateStatusLabels() {
    const t = form.querySelector('input[name=type]:checked').value;
    [...F.status.options].forEach((o) => { o.textContent = STATUS[o.value][t]; });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = normalize({
      id: editingId || uid(),
      type: form.querySelector('input[name=type]:checked').value,
      title: F.title.value,
      year: F.year.value,
      status: F.status.value,
      rating: F.rating.value,
      comment: F.comment.value.trim(),
      date: F.date.value,
      fav: F.fav.checked,
      poster: F.poster.value.trim(),
      createdAt: editingId ? items.find((i) => i.id === editingId)?.createdAt : Date.now(),
      updatedAt: Date.now(),
    });
    if (!data) return;
    if (editingId) items = items.map((i) => (i.id === editingId ? data : i));
    else items.unshift(data);
    save(); render(); dialog.close();
    toast(editingId ? 'Modifié ✓' : `« ${data.title} » ajouté ✓`);
  });

  $('#deleteBtn').addEventListener('click', () => {
    const it = items.find((i) => i.id === editingId);
    if (!it || !confirm(`Supprimer « ${it.title} » ?`)) return;
    items = items.filter((i) => i.id !== editingId);
    save(); render(); dialog.close();
    toast('Supprimé');
  });
  $('#closeBtn').addEventListener('click', () => dialog.close());
  $('#cancelBtn').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  $('#typeSeg').addEventListener('change', updateStatusLabels);

  // ---------- Toolbar ----------
  $('#addBtn').addEventListener('click', () => openForm());
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-type]'); if (!b) return;
    state.type = b.dataset.type;
    document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('active', x === b));
    render();
  });
  $('#search').addEventListener('input', (e) => { state.q = e.target.value; render(); });
  $('#statusFilter').addEventListener('change', (e) => { state.status = e.target.value; render(); });
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });

  // ---------- Backup menu ----------
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    menuBtn.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) menu.hidden = true; });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = `feel-your-senses-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    menu.hidden = true;
  });

  $('#importInput').addEventListener('change', async (e) => {
    const file = e.target.files[0]; e.target.value = ''; menu.hidden = true;
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data)) throw new Error();
      const incoming = data.map(normalize).filter(Boolean);
      const byId = new Map(items.map((i) => [i.id, i]));
      incoming.forEach((i) => byId.set(i.id, i));
      items = [...byId.values()];
      save(); render();
      toast(`${incoming.length} élément(s) importé(s)`);
    } catch { toast('Fichier invalide'); }
  });

  // ---------- Utils ----------
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function norm(s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function today() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  buildStars();
  render();
})();
