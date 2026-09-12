// Home: the "I'm hungry" button and the idea cards it throws out.

import { h, raw, rawJoin, esc, minsText, toast, greeting, mealNow, buzz } from '../ui.js';
import { amountText, item } from '../data/catalog.js';
import { MEALS, DIETS } from '../data/recipes.js';
import { suggest, scaleQty } from '../match.js';
import { openCook } from './cook.js';
import * as store from '../store.js';
import { askClaude, hasKey } from '../ai.js';

let ui = { round: 0, maxMins: 0, meal: '', show: 3, results: null, busy: false };

export function resetIdeas() { ui = { ...ui, round: 0, results: null, show: 3 }; }

export function home(mount, go) {
  const st = store.get();
  const shelfCount = Object.keys(st.pantry).length;

  const timeChips = [[0, 'Any time'], [10, '≤ 10 min'], [20, '≤ 20 min'], [30, '≤ 30 min']]
    .map(([v, label]) => `<button class="chip ${ui.maxMins === v ? 'is-on' : ''}" data-mins="${v}">${label}</button>`);

  const mealChips = [`<button class="chip ${ui.meal === '' ? 'is-on' : ''}" data-meal="">Anything</button>`]
    .concat(MEALS.map(m => `<button class="chip ${ui.meal === m.id ? 'is-on' : ''}" data-meal="${m.id}">${m.emoji} ${m.name}</button>`));

  const el = h`
    <div>
      <div class="row" style="margin-bottom:10px">
        <div class="grow">
          <div class="muted small">${greeting()} — ${shelfCount} thing${shelfCount === 1 ? '' : 's'} on your shelf</div>
        </div>
        <span class="pill">${(DIETS.find(d => d.id === st.diet) || DIETS[0]).name}</span>
      </div>

      <button class="hungry" data-act="hungry">
        I'm hungry
        <span>${shelfCount ? 'show me what I can make right now' : 'add a few things to your shelf first'}</span>
      </button>

      <div class="sec-title">How long have you got?</div>
      <div class="chips">${rawJoin(timeChips)}</div>
      <div class="sec-title">What kind of meal?</div>
      <div class="chips">${rawJoin(mealChips)}</div>

      <div id="ideas-out"></div>
      <div id="home-extra"></div>
    </div>`;

  el.querySelector('[data-act="hungry"]').onclick = () => {
    if (!Object.keys(store.get().pantry).length) { go('shelf'); toast('Tap the things you have — then come back'); return; }
    buzz();
    ui.round++; ui.show = 3;
    ui.results = null;
    renderIdeas(el, go);
    document.getElementById('ideas-out')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  el.querySelectorAll('[data-mins]').forEach(b => b.onclick = () => {
    ui.maxMins = Number(b.dataset.mins); ui.results = null;
    home(mount, go);
    if (ui.round) renderIdeas(document.getElementById('screen').firstElementChild, go);
  });
  el.querySelectorAll('[data-meal]').forEach(b => b.onclick = () => {
    ui.meal = b.dataset.meal; ui.results = null;
    home(mount, go);
    if (ui.round) renderIdeas(document.getElementById('screen').firstElementChild, go);
  });

  mount.innerHTML = '';
  mount.appendChild(el);
  if (ui.round) renderIdeas(el, go);
  renderExtra(el, go);
  return el;
}

function renderIdeas(el, go) {
  const out = el.querySelector('#ideas-out');
  if (!out) return;
  const st = store.get();
  const list = suggest(st, { maxMins: ui.maxMins, meal: ui.meal, diet: st.diet, shuffle: ui.round });
  ui.results = list;

  if (!list.length) {
    out.innerHTML = `
      <div class="sec-title">Ideas</div>
      <div class="card pad empty">
        <div class="empty-e">🤔</div>
        <p>Nothing matches yet with those filters.</p>
        <p class="small">Try "Any time", or add a few basics — onion, eggs, oil, salt, rice or pasta open up most of the book.</p>
      </div>`;
    return;
  }

  const shown = list.slice(0, ui.show);
  out.innerHTML = `<div class="sec-title">Ideas for you</div><div class="ideas"></div>`;
  const grid = out.querySelector('.ideas');
  shown.forEach(s => grid.appendChild(ideaCard(s)));

  const more = h`<div class="row" style="margin-top:12px; gap:8px">
      <button class="btn grow" data-act="shuffle">🔁 Different ideas</button>
      ${raw(list.length > ui.show ? `<button class="btn" data-act="more">Show ${Math.min(3, list.length - ui.show)} more</button>` : '')}
    </div>`;
  more.querySelector('[data-act="shuffle"]').onclick = () => { ui.round++; ui.show = 3; renderIdeas(el, go); };
  more.querySelector('[data-act="more"]')?.addEventListener('click', () => { ui.show += 3; renderIdeas(el, go); });
  out.appendChild(more);

  if (hasKey()) out.appendChild(aiButton(el, go));
}

export function ideaCard(s) {
  const r = s.recipe;
  const missTxt = s.missing.map(g => amountText(g.id, scaleQty(g.q ?? 0, s.factor, item(g.id).unit))).join(', ');
  const badge = s.ready
    ? `<span class="pill pill-ok">✓ You have it all</span>`
    : `<span class="pill pill-warn">need ${esc(missTxt)}</span>`;
  const swaps = s.swaps?.length
    ? `<span class="pill">using ${esc(item(s.swaps[0].used).name.toLowerCase())}</span>` : '';
  const cwBad = s.cwMissing?.length ? `<span class="pill">no ${esc(s.cwMissing[0].name.toLowerCase())}</span>` : '';

  const el = h`
    <button class="idea">
      <div class="idea-emoji">${r.emoji}</div>
      <div class="grow">
        <div class="idea-name">${r.name}${r.ai ? ' ✨' : ''}</div>
        <div class="idea-meta">
          <span class="pill">⏱ ${esc(minsText(r.mins))}</span>
          ${raw(badge)} ${raw(swaps)} ${raw(cwBad)}
        </div>
        <div class="idea-why">${r.blurb}</div>
      </div>
    </button>`;
  el.onclick = () => openCook(s);
  return el;
}

function aiButton(el, go) {
  const box = h`<div style="margin-top:12px">
      <button class="btn btn-block" data-act="ai">✨ Ask Claude for something new</button>
      <div class="small muted center" style="margin-top:6px">Invents a recipe from exactly what is on your shelf.</div>
    </div>`;
  const btn = box.querySelector('[data-act="ai"]');
  btn.onclick = async () => {
    if (ui.busy) return;
    ui.busy = true;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Thinking about your shelf…';
    try {
      const made = await askClaude({ maxMins: ui.maxMins, meal: ui.meal });
      made.forEach(store.saveAiRecipe);
      toast(`${made.length} new idea${made.length > 1 ? 's' : ''} from Claude`);
      ui.round++;
      renderIdeas(el, go);
    } catch (e) {
      toast(e.message || 'Could not reach Claude', 4200);
      btn.disabled = false;
      btn.textContent = '✨ Ask Claude for something new';
    } finally {
      ui.busy = false;
    }
  };
  return box;
}

function renderExtra(el, go) {
  const st = store.get();
  const out = el.querySelector('#home-extra');
  const rows = [];

  if (st.favs.length) rows.push(section('Saved', st.favs));
  if (st.recent.length) rows.push(section('Cooked recently', st.recent.slice(0, 6)));

  if (!rows.length && !ui.round) {
    const tip = h`<div class="card pad" style="margin-top:22px">
        <b>How this works</b>
        <ol class="small muted" style="margin:8px 0 0; padding-left:20px; line-height:1.7">
          <li>Go to <b>Shelf</b> and tap everything you actually have.</li>
          <li>Set your pans and your hob on the <b>Kitchen</b> tab.</li>
          <li>Come back, hit <b>I'm hungry</b>, pick a card, and cook along with the steps.</li>
        </ol>
      </div>`;
    out.innerHTML = '';
    out.appendChild(tip);
    return;
  }

  out.innerHTML = '';
  rows.forEach(r => out.appendChild(r));

  function section(title, ids) {
    const st2 = store.get();
    const box = h`<div><div class="sec-title">${title}</div><div class="ideas"></div></div>`;
    const grid = box.querySelector('.ideas');
    const all = suggest(st2, { maxMissing: 99, diet: 'any' });
    ids.map(id => all.find(s => s.recipe.id === id)).filter(Boolean).forEach(s => grid.appendChild(ideaCard(s)));
    return box;
  }
}
