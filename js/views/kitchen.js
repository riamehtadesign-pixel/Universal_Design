// Kitchen: your pans, your hob, how many you cook for. Set once, used everywhere.

import { h, raw, rawJoin, esc, toast } from '../ui.js';
import { COOKWARE } from '../data/cookware.js';
import { heatText, HEAT } from '../data/cookware.js';
import { DIETS } from '../data/recipes.js';
import * as store from '../store.js';

export function kitchen(mount, go) {
  const st = store.get();

  const cw = COOKWARE.map(c => {
    const on = st.cookware.includes(c.id);
    return `<label class="check" data-cw="${c.id}">
        <input type="checkbox" ${on ? 'checked' : ''} />
        <span class="check-t grow"><b>${c.emoji} ${esc(c.name)}</b><div class="small muted">${esc(c.hint)}</div></span>
      </label>`;
  });

  const diets = DIETS.map(d =>
    `<button class="chip ${st.diet === d.id ? 'is-on' : ''}" data-diet="${d.id}">${esc(d.name)}</button>`);

  const themes = [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([v, n]) =>
    `<button class="chip ${st.theme === v ? 'is-on' : ''}" data-theme="${v}">${n}</button>`);

  const heatPreview = ['low', 'medium', 'mhigh', 'high'].map(k =>
    `<div class="row small" style="gap:8px"><b style="min-width:142px; white-space:nowrap">${esc(heatText(k, st.hob))}</b><span class="muted">${esc(HEAT[k].why)}</span></div>`);

  const el = h`
    <div class="stack">
      <div class="card pad">
        <b>Cooking for</b>
        <div class="row" style="margin-top:10px">
          <div class="stepper">
            <button data-act="s-">−</button>
            <span class="v">${st.servings}</span>
            <button data-act="s+">+</button>
          </div>
          <span class="muted small grow">${st.servings === 1 ? 'just you' : `${st.servings} people`} — amounts get scaled</span>
        </div>
      </div>

      <div class="card pad">
        <b>What you eat</b>
        <div class="chips" style="margin-top:10px">${rawJoin(diets)}</div>
      </div>

      <div class="card pad">
        <b>Your hob</b>
        <div class="small muted" style="margin:4px 0 12px">So every step can say the actual number to turn your induction to.</div>
        <div class="chips">
          <button class="chip ${st.hob.dialMode === 'levels' ? 'is-on' : ''}" data-hob="levels">Numbered levels</button>
          <button class="chip ${st.hob.dialMode === 'watts' ? 'is-on' : ''}" data-hob="watts">Watts</button>
        </div>
        <label class="field" style="margin-top:12px">
          <span>${st.hob.dialMode === 'watts' ? 'Highest wattage' : 'Highest level on the dial'}</span>
          <input type="number" id="dialmax" min="2" max="3000" value="${st.hob.dialMax}" />
        </label>
        <div class="hr"></div>
        ${rawJoin(heatPreview)}
      </div>

      <div class="card" style="padding:6px 14px">
        <div class="pad" style="padding:10px 0 2px"><b>Pots and pans you own</b>
          <div class="small muted">Recipes will use what you have, or tell you the nearest swap.</div>
        </div>
        ${rawJoin(cw)}
      </div>

      <div class="card pad">
        <b>✨ Claude ideas (optional)</b>
        <div class="small muted" style="margin:4px 0 12px">
          The app works fully offline without this. Add an Anthropic API key and you also get made-up recipes
          built from exactly what is on your shelf. The key is stored only on this device.
        </div>
        <label class="field">
          <span>Anthropic API key</span>
          <input type="password" id="aikey" placeholder="sk-ant-…" value="${esc(st.aiKey)}" autocomplete="off" />
        </label>
        <div class="row" style="margin-top:10px">
          <button class="btn btn-sm grow" data-act="savekey">Save key</button>
          ${raw(st.aiKey ? `<button class="btn btn-sm" data-act="clearkey">Remove</button>` : '')}
        </div>
        ${raw(st.aiRecipes.length ? `<div class="small muted" style="margin-top:10px">${st.aiRecipes.length} saved Claude recipe${st.aiRecipes.length > 1 ? 's' : ''} · <a href="#" data-act="clearai">clear</a></div>` : '')}
        <div class="small muted" style="margin-top:10px">Get a key at console.anthropic.com. Calls cost a fraction of a cent each.</div>
      </div>

      <div class="card pad">
        <b>Look</b>
        <div class="chips" style="margin-top:10px">${rawJoin(themes)}</div>
      </div>

      <div class="card pad">
        <b>Your data</b>
        <div class="small muted" style="margin:4px 0 12px">Everything lives on this device. Nothing is uploaded.</div>
        <div class="row wrap" style="gap:8px">
          <button class="btn btn-sm" data-act="export">⬇ Save a backup</button>
          <button class="btn btn-sm" data-act="import">⬆ Restore</button>
          <button class="btn btn-sm" data-act="wipe">Reset everything</button>
        </div>
        <input type="file" id="file" accept="application/json" hidden />
      </div>

      <div class="center small muted" style="padding:8px 0 4px">
        Pantry · add it to your home screen and it opens like an app, offline.
      </div>
    </div>`;

  const re = () => kitchen(mount, go);

  el.querySelector('[data-act="s-"]').onclick = () => { store.set({ servings: Math.max(1, st.servings - 1) }); re(); };
  el.querySelector('[data-act="s+"]').onclick = () => { store.set({ servings: Math.min(8, st.servings + 1) }); re(); };
  el.querySelectorAll('[data-diet]').forEach(b => b.onclick = () => { store.set({ diet: b.dataset.diet }); re(); });
  el.querySelectorAll('[data-hob]').forEach(b => b.onclick = () => {
    const mode = b.dataset.hob;
    store.set({ hob: { ...st.hob, dialMode: mode, dialMax: mode === 'watts' ? 2000 : 9 } });
    re();
  });
  el.querySelector('#dialmax').addEventListener('change', e => {
    const v = Math.max(2, Math.min(3000, Number(e.target.value) || 9));
    store.set({ hob: { ...store.get().hob, dialMax: v } });
    re();
  });
  el.querySelectorAll('[data-cw]').forEach(row => {
    row.querySelector('input').addEventListener('change', () => { store.toggleCookware(row.dataset.cw); });
  });
  el.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => {
    store.set({ theme: b.dataset.theme });
    applyTheme();
    re();
  });

  el.querySelector('[data-act="savekey"]').onclick = () => {
    const v = el.querySelector('#aikey').value.trim();
    store.set({ aiKey: v });
    toast(v ? 'Key saved on this device' : 'Key cleared');
    re();
  };
  el.querySelector('[data-act="clearkey"]')?.addEventListener('click', () => { store.set({ aiKey: '' }); toast('Key removed'); re(); });
  el.querySelector('[data-act="clearai"]')?.addEventListener('click', e => {
    e.preventDefault(); store.set({ aiRecipes: [] }); toast('Cleared'); re();
  });

  el.querySelector('[data-act="export"]').onclick = () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pantry-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const file = el.querySelector('#file');
  el.querySelector('[data-act="import"]').onclick = () => file.click();
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      store.importJson(await f.text());
      applyTheme();
      toast('Restored');
      re();
    } catch (err) { toast(err.message || 'Could not read that file', 3800); }
  });
  el.querySelector('[data-act="wipe"]').onclick = () => {
    if (confirm('Delete your shelf, pans, settings and saved recipes? This cannot be undone.')) {
      store.wipe(); applyTheme(); toast('Reset'); re();
    }
  };

  mount.innerHTML = '';
  mount.appendChild(el);
  return el;
}

export function applyTheme() {
  const t = store.get().theme;
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
