// The buy list: what the recipes said you were missing, plus anything you add.

import { h, raw, rawJoin, esc, toast } from '../ui.js';
import { CATALOG, UNITS, item } from '../data/catalog.js';
import { suggest } from '../match.js';
import * as store from '../store.js';

export function buy(mount, go) {
  const st = store.get();

  // What would unlock the most recipes if you bought it?
  const gaps = {};
  suggest(st, { maxMissing: 2, diet: st.diet }).forEach(s => {
    s.missing.forEach(g => { gaps[g.id] = (gaps[g.id] || 0) + 1; });
  });
  const unlock = Object.entries(gaps)
    .filter(([id]) => !st.buy.includes(id))
    .sort((a, b) => b[1] - a[1]).slice(0, 6);

  const rows = st.buy.map(id => {
    const it = item(id);
    return `<label class="check" data-id="${esc(id)}">
        <input type="checkbox" />
        <span class="check-t grow"><b>${esc(it.name)}</b> <span class="small muted">${esc(it.emoji)}</span></span>
        <button class="btn btn-sm btn-ghost" data-act="drop" aria-label="remove">✕</button>
      </label>`;
  });

  const el = h`
    <div>
      <div class="sec-title" style="margin-top:4px">Buy list (${st.buy.length})</div>
      ${raw(st.buy.length
        ? `<div class="card" style="padding:4px 14px">${rows.join('')}</div>
           <div class="small muted center" style="margin-top:8px">Tick something off and it goes straight onto your shelf.</div>`
        : `<div class="card pad empty">
             <div class="empty-e">🛒</div>
             <p>Nothing on the list.</p>
             <p class="small">When a recipe is short of something, tap “Add to buy list” and it lands here.</p>
           </div>`)}

      ${raw(unlock.length ? `<div class="sec-title">Worth picking up</div>` : '')}
      <div id="unlock" class="chips"></div>

      <div class="sec-title">Add something</div>
      <input type="search" id="addq" placeholder="Search the library — paneer, oats, soy sauce…" />
      <div id="addres" class="chips" style="margin-top:10px"></div>
    </div>`;

  // tick off -> onto the shelf
  el.querySelectorAll('.check').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('input').addEventListener('change', e => {
      if (!e.target.checked) return;
      const it = item(id);
      store.boughtIt(id, it.unit === 'stock' ? 2 : (UNITS[it.unit]?.step || 1));
      toast(`${it.name} is on your shelf`);
      buy(mount, go);
    });
    row.querySelector('[data-act="drop"]').onclick = e => {
      e.preventDefault(); e.stopPropagation();
      store.toggleBuy(id);
      buy(mount, go);
    };
  });

  const un = el.querySelector('#unlock');
  unlock.forEach(([id, count]) => {
    const b = h`<button class="chip">➕ ${item(id).name} <span class="muted">· unlocks ${count}</span></button>`;
    b.onclick = () => { store.addBuy([id]); buy(mount, go); };
    un.appendChild(b);
  });

  const input = el.querySelector('#addq');
  const res = el.querySelector('#addres');
  input.addEventListener('input', () => {
    const needle = input.value.trim().toLowerCase();
    res.innerHTML = '';
    if (needle.length < 2) return;
    CATALOG.filter(i => i.name.toLowerCase().includes(needle)).slice(0, 12).forEach(it => {
      const b = h`<button class="chip">${it.emoji} ${it.name}</button>`;
      b.onclick = () => {
        store.addBuy([it.id]);
        input.value = '';
        toast(`${it.name} added to the list`);
        buy(mount, go);
      };
      res.appendChild(b);
    });
  });

  mount.innerHTML = '';
  mount.appendChild(el);
  return el;
}
