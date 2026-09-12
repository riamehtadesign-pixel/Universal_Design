// The shelf: tap what you have, tap again to set how much.

import { h, raw, rawJoin, esc, toast } from '../ui.js';
import { CATS, CATALOG, UNITS, item } from '../data/catalog.js';
import * as store from '../store.js';

let q = '';            // search text
let onlyMine = false;  // show only what I have
let active = null;     // item id whose stepper is open

export function resetShelf() { q = ''; active = null; }

export function shelf(mount, go) {
  const st = store.get();
  const have = Object.keys(st.pantry).length;
  const needle = q.trim().toLowerCase();

  const firstRun = !have;
  const visible = CATALOG.filter(it => {
    if (onlyMine && !st.pantry[it.id]) return false;
    if (!needle) return true;
    return it.name.toLowerCase().includes(needle) || it.id.includes(needle.replace(/ /g, '_'));
  });

  const el = h`
    <div>
      <div class="stack">
        <input type="search" id="q" placeholder="Search 130+ items — onion, soy, paneer…" value="${q}" />
        <div class="row wrap" style="gap:8px">
          <button class="chip ${onlyMine ? 'is-on' : ''}" data-act="mine">🧺 On my shelf (${have})</button>
          <button class="chip" data-act="add">➕ Add your own</button>
          ${raw(have ? `<button class="chip" data-act="clear">Clear shelf</button>` : '')}
        </div>
      </div>
      <div id="shelves"></div>
    </div>`;

  const shelves = el.querySelector('#shelves');
  let any = false;
  for (const cat of CATS) {
    const items = visible.filter(i => i.cat === cat.id);
    if (!items.length) continue;
    any = true;
    const mine = items.filter(i => st.pantry[i.id]).length;
    const box = h`
      <div class="shelf-cat">
        <div class="shelf-head">
          <h3>${cat.emoji} ${cat.name}</h3>
          <span class="small muted">${mine ? `${mine} on shelf` : ''}</span>
        </div>
        <div class="shelf-grid"></div>
      </div>`;
    const grid = box.querySelector('.shelf-grid');
    items.forEach(it => grid.appendChild(tile(it, mount, go, firstRun)));
    shelves.appendChild(box);
  }

  if (!any) {
    shelves.appendChild(h`<div class="empty">
        <div class="empty-e">🔍</div>
        <p>Nothing called “${esc(q)}”.</p>
        <p class="small">Add it yourself with ➕ Add your own.</p>
      </div>`);
  }

  const search = el.querySelector('#q');
  search.addEventListener('input', () => {
    q = search.value; active = null;
    const pos = search.selectionStart;
    const fresh = shelf(mount, go);
    const s2 = fresh.querySelector('#q');
    s2.focus(); s2.setSelectionRange(pos, pos);
  });
  el.querySelector('[data-act="mine"]').onclick = () => { onlyMine = !onlyMine; shelf(mount, go); };
  el.querySelector('[data-act="add"]').onclick = () => addOwn(mount, go);
  el.querySelector('[data-act="clear"]')?.addEventListener('click', () => {
    if (confirm('Empty the whole shelf? Your pans, settings and buy list stay.')) {
      store.set({ pantry: {} });
      toast('Shelf emptied');
      shelf(mount, go);
    }
  });

  mount.innerHTML = '';
  mount.appendChild(el);
  return el;
}

function tile(it, mount, go, firstRun) {
  const n = store.qty(it.id);
  const u = UNITS[it.unit] || UNITS.stock;
  const isStock = it.unit === 'stock';
  const label = n ? u.short(n) : '';

  if (active === it.id && !isStock) {
    const el = h`
      <div class="item has">
        <div class="item-e">${it.emoji}</div>
        <div class="stepper">
          <button data-act="minus" aria-label="less">−</button>
          <span class="v">${esc(u.short(n) || '0')}</span>
          <button data-act="plus" aria-label="more">+</button>
        </div>
        <div class="item-n muted">${it.name}</div>
      </div>`;
    el.querySelector('[data-act="minus"]').onclick = e => { e.stopPropagation(); store.bump(it.id, -u.step); shelf(mount, go); };
    el.querySelector('[data-act="plus"]').onclick = e => { e.stopPropagation(); store.bump(it.id, u.step); shelf(mount, go); };
    el.onclick = () => { active = null; shelf(mount, go); };
    return el;
  }

  const el = h`
    <div class="item ${n ? 'has' : 'out'}" role="button" tabindex="0">
      <div class="item-e">${it.emoji}</div>
      <div class="item-n">${it.name}</div>
      <div class="item-q">${label || (firstRun ? (isStock ? 'tap if you have it' : 'tap to add') : '')}</div>
    </div>`;

  const activate = () => {
    if (isStock) {
      store.cycleStock(it.id);
      shelf(mount, go);
    } else if (!n) {
      store.setQty(it.id, u.step);
      active = it.id;
      shelf(mount, go);
    } else {
      active = it.id;
      shelf(mount, go);
    }
  };
  el.onclick = activate;
  el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } };
  return el;
}

function addOwn(mount, go) {
  const name = prompt('What is it called?');
  if (!name) return;
  const unit = (prompt('How do you count it? Type: pc (pieces), g, ml, or jar', 'pc') || 'pc').toLowerCase();
  const unitId = ['pc', 'g', 'ml'].includes(unit) ? unit : 'stock';
  const id = 'my_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const custom = [...(store.get().custom || []), { id, name: name.trim(), emoji: '🍽️', cat: 'tin', unit: unitId }];
  store.set({ custom });
  import('../data/catalog.js').then(m => {
    m.registerItems(custom);
    store.setQty(id, unitId === 'stock' ? 2 : (UNITS[unitId]?.step || 1));
    toast(`${name} added to your shelf`);
    shelf(mount, go);
  });
}
