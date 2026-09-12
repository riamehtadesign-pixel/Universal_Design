// Cook mode: phone propped against the toaster, one step at a time, timers that ring.

import { h, raw, rawJoin, esc, mmss, minsText, toast, buzz, chime } from '../ui.js';
import { amountText, item } from '../data/catalog.js';
import { heatText } from '../data/cookware.js';
import { usedItems, scaleQty } from '../match.js';
import * as store from '../store.js';

const root = () => document.getElementById('cook');

let cur = null;      // { s, phase, idx, done:Set }
let tick = null;     // interval id
let timer = null;    // { left, total, running }
let wakeLock = null;

export function openCook(s) {
  cur = { s, phase: 'prep', idx: 0, done: new Set() };
  try { history.pushState({ cook: true }, ''); } catch {}
  root().hidden = false;
  document.body.style.overflow = 'hidden';
  keepAwake(true);
  render();
}

export function closeCook(opts = {}) {
  stopTimer();
  if (!opts.fromHistory && history.state?.cook) { history.back(); }
  keepAwake(false);
  root().hidden = true;
  root().innerHTML = '';
  document.body.style.overflow = '';
  cur = null;
}

export const isCooking = () => !!cur;

async function keepAwake(on) {
  try {
    if (on) wakeLock = await navigator.wakeLock?.request('screen');
    else { await wakeLock?.release(); wakeLock = null; }
  } catch { /* not supported — no problem */ }
}

/* ---------------- render ---------------- */

function render() {
  if (!cur) return;
  root().innerHTML = '';
  root().appendChild(cur.phase === 'prep' ? prepView() : stepView());
  root().scrollTop = 0;
}

function topBar(sub) {
  const { recipe } = cur.s;
  const fav = store.get().favs.includes(recipe.id);
  const el = h`
    <div class="cook-top">
      <button class="btn btn-ghost btn-sm" data-act="close" aria-label="Close">✕</button>
      <div class="grow">
        <div class="cook-title">${recipe.emoji} ${recipe.name}</div>
        <div class="small muted">${sub}</div>
      </div>
      <button class="btn btn-ghost btn-sm" data-act="fav" aria-label="Save">${fav ? '★' : '☆'}</button>
    </div>`;
  el.querySelector('[data-act="close"]').onclick = () => closeCook();
  el.querySelector('[data-act="fav"]').onclick = e => {
    const on = store.toggleFav(recipe.id);
    e.target.textContent = on ? '★' : '☆';
    toast(on ? 'Saved to favourites' : 'Removed from favourites');
  };
  return el;
}

function prepView() {
  const { s } = cur;
  const { recipe: r } = s;
  const st = store.get();
  const factor = s.factor || 1;
  const isJar = id => item(id).unit === 'stock';

  // One line per thing to get ready. A swapped ingredient loses the original
  // prep note — "chop fine" makes no sense once you're using garlic powder.
  const line = g => {
    const usedId = g.usedId || g.id;
    const swapped = usedId !== g.id;
    const it = item(usedId);
    const q = scaleQty(g.q ?? 0, factor, it.unit);
    const amt = amountText(usedId, q);
    const note = swapped
      ? ` — instead of ${item(g.id).name.toLowerCase()}`
      : (g.prep ? ` — ${g.prep}` : (g.use ? ` — ${g.use}` : ''));
    return `<label class="check">
        <input type="checkbox" />
        <span class="check-t grow"><b>${esc(amt)}</b>${esc(note)}</span>
      </label>`;
  };

  const jarLine = (gs, label) => {
    if (!gs.length) return '';
    const names = gs.map(g => item(g.usedId || g.id).name.toLowerCase()).join(' · ');
    return `<label class="check">
        <input type="checkbox" />
        <span class="check-t grow"><b>${esc(label)}</b> <span class="muted">${esc(names)}</span></span>
      </label>`;
  };

  const needMain = (s.have || []).filter(g => !isJar(g.usedId || g.id));
  const needJars = (s.have || []).filter(g => isJar(g.usedId || g.id));
  const optMain  = (s.optHave || []).filter(g => !isJar(g.id));
  const optJars  = (s.optHave || []).filter(g => isJar(g.id));

  const cw = (s.cookware || []).map(c =>
    `<span class="pill">${c.emoji} ${esc(c.name)}${c.insteadOf ? ` <i>(instead of a ${esc(c.insteadOf.toLowerCase())})</i>` : ''}${c.ok ? '' : ' — you don\'t have this'}</span>`);

  const missing = s.missing?.length
    ? `<div class="card pad" style="border-color:var(--miss)">
         <b>You're short of ${s.missing.length} thing${s.missing.length > 1 ? 's' : ''}:</b>
         <div class="small" style="margin:6px 0 12px">${s.missing.map(g => esc(amountText(g.id, scaleQty(g.q ?? 0, factor, item(g.id).unit)))).join(', ')}</div>
         <button class="btn btn-sm" data-act="buy">🛒 Add to buy list</button>
       </div>`
    : '';

  const scaleNote = factor !== 1
    ? `<div class="small muted" style="margin-top:6px">Amounts are scaled for ${st.servings} ${st.servings > 1 ? 'people' : 'person'}. The spoonfuls inside the steps are written for ${r.serves} — adjust those by eye.</div>`
    : '';

  const el = h`
    <div class="cook-in">
      ${raw(topBar(`${minsText(r.mins)} · serves ${Math.max(1, Math.round((r.serves || 1) * factor))} · ${dietLabel(r.diet)}`).outerHTML)}
      <p class="muted" style="margin:0 0 14px">${r.blurb}</p>
      <div class="row wrap" style="gap:6px">${rawJoin(cw, ' ')}</div>
      ${raw(missing)}
      <div class="sec-title">Chop and measure first</div>
      <div class="card" style="padding:4px 14px">
        ${rawJoin(needMain.map(line))}
        ${raw(jarLine(needJars, 'Keep these within reach:'))}
      </div>
      ${raw(optMain.length || optJars.length ? `
        <div class="sec-title">Also on your shelf, if you fancy it</div>
        <div class="card" style="padding:4px 14px">
          ${optMain.map(line).join('')}
          ${jarLine(optJars, 'And a dash of:')}
        </div>` : '')}
      ${raw(scaleNote)}
      <div class="sec-title">${(r.steps || []).length} steps${totalTimerText(r)}</div>
      <ol class="card pad small muted" style="margin:0; padding-left:32px">
        ${rawJoin((r.steps || []).map(x => `<li style="margin:4px 0">${esc(x.do)}</li>`))}
      </ol>
      <div style="height:12px"></div>
      <div class="cook-nav"><div class="cook-nav-in">
        <button class="btn btn-primary btn-block" data-act="start">Start cooking →</button>
      </div></div>
    </div>`;

  el.querySelectorAll('.check').forEach(l => {
    l.addEventListener('change', () => l.classList.toggle('done', l.querySelector('input').checked));
  });
  el.querySelector('[data-act="start"]').onclick = () => { cur.phase = 'step'; cur.idx = 0; render(); };
  el.querySelector('[data-act="buy"]')?.addEventListener('click', () => {
    store.addBuy(s.missing.map(g => g.id));
    toast('Added to your buy list');
  });
  return el;
}

function totalTimerText(r) {
  const secs = (r.steps || []).reduce((a, s) => a + (s.t || 0), 0);
  return secs ? ` · about ${Math.round(secs / 60)} min of timers` : '';
}

const dietLabel = d => ({ vegan: 'vegan', veg: 'vegetarian', egg: 'has egg', meat: 'has meat' }[d] || '');

function stepView() {
  const { s, idx } = cur;
  const r = s.recipe;
  const steps = r.steps || [];
  const step = steps[idx];
  const last = idx === steps.length - 1;
  const hob = store.get().hob;

  if (!timer || timer.stepIdx !== idx) {
    stopTimer();
    timer = step.t ? { stepIdx: idx, left: step.t, total: step.t, running: false } : null;
  }

  const dots = steps.map((_, i) => `<span class="dot ${i <= idx ? 'on' : ''}"></span>`);
  const heat = step.heat ? `<span class="pill pill-warn">🔥 ${esc(heatText(step.heat, hob))}</span>` : '';
  const pan = (s.cookware || []).map(c =>
    `<span class="pill">${c.emoji} ${esc(c.name)}${c.insteadOf ? ` <i>(for the ${esc(c.insteadOf.toLowerCase())})</i>` : ''}</span>`).join(' ');

  const el = h`
    <div class="cook-in">
      ${raw(topBar(`Step ${idx + 1} of ${steps.length}`).outerHTML)}
      <div class="dots">${rawJoin(dots)}</div>
      <div class="card pad">
        <div class="step-n">Step ${idx + 1}</div>
        <div class="step-do">${step.do}</div>
        <div class="row wrap" style="gap:6px; margin-top:14px">${raw(heat)} ${raw(pan)}</div>
        ${raw(step.tip ? `<div class="step-tip">💡 ${esc(step.tip)}</div>` : '')}
        ${raw(timer ? `
          <div class="hr"></div>
          <div class="timer" id="tdisp">${mmss(timer.left)}</div>
          <div class="row" style="gap:8px">
            <button class="btn grow" data-act="t-toggle">${timer.running ? '⏸ Pause' : '▶ Start timer'}</button>
            <button class="btn btn-sm" data-act="t-reset">Reset</button>
          </div>
          <div class="small muted center" style="margin-top:8px">Timers are a guide — trust your eyes and nose over the clock.</div>` : '')}
      </div>
      ${raw(last && r.serve ? `<div class="card pad" style="margin-top:12px"><b>To serve</b><div class="muted small" style="margin-top:4px">${esc(r.serve)}</div></div>` : '')}
      <div class="cook-nav"><div class="cook-nav-in">
        <button class="btn" data-act="back" style="flex:0 0 92px">← Back</button>
        <button class="btn btn-primary grow" data-act="next">${last ? "I'm done ✓" : 'Next step →'}</button>
      </div></div>
    </div>`;

  el.querySelector('[data-act="back"]').onclick = () => {
    stopTimer();
    if (cur.idx === 0) { cur.phase = 'prep'; } else { cur.idx--; }
    render();
  };
  el.querySelector('[data-act="next"]').onclick = () => {
    stopTimer();
    if (last) finish(); else { cur.idx++; render(); }
  };
  el.querySelector('[data-act="t-toggle"]')?.addEventListener('click', toggleTimer);
  el.querySelector('[data-act="t-reset"]')?.addEventListener('click', () => {
    stopTimer(); timer.left = timer.total; paintTimer();
  });
  return el;
}

/* ---------------- timer ---------------- */

function toggleTimer() {
  if (!timer) return;
  if (timer.running) { stopTimer(); }
  else {
    timer.running = true;
    const endsAt = Date.now() + timer.left * 1000;
    tick = setInterval(() => {
      timer.left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      paintTimer();
      if (timer.left <= 0) {
        clearInterval(tick); tick = null; timer.running = false;
        chime(); buzz([300, 120, 300]);
        toast('Time — check the pan');
        paintTimer();
      }
    }, 250);
  }
  paintTimer();
}

function stopTimer() {
  if (tick) { clearInterval(tick); tick = null; }
  if (timer) timer.running = false;
}

function paintTimer() {
  const d = document.getElementById('tdisp');
  if (!d || !timer) return;
  d.textContent = mmss(timer.left);
  d.classList.toggle('ring', timer.left === 0);
  const b = root().querySelector('[data-act="t-toggle"]');
  if (b) b.textContent = timer.left === 0 ? '↻ Again' : timer.running ? '⏸ Pause' : '▶ Start timer';
}

/* ---------------- finish ---------------- */

function finish() {
  const { s } = cur;
  store.markCooked(s.recipe.id);
  const uses = usedItems(s).filter(u => u.unit !== 'stock' && u.q > 0);

  const el = h`
    <div class="cook-in">
      <div class="empty">
        <div class="empty-e">🍽️</div>
        <h2 style="margin:8px 0 6px">Enjoy it.</h2>
        <p class="muted">${s.recipe.name} — cooked.</p>
      </div>
      ${raw(uses.length ? `
        <div class="card pad">
          <b>Take these off the shelf?</b>
          <div class="small muted" style="margin:6px 0 12px">${uses.map(u => `${esc(u.name)} ×${u.q}`).join(' · ')}</div>
          <div class="row">
            <button class="btn btn-primary grow" data-act="sub">Yes, update my shelf</button>
            <button class="btn" data-act="skip">Not now</button>
          </div>
          <div class="small muted" style="margin-top:10px">Jars and bottles (spices, sauces, oil) are left alone — mark those Low yourself on the Shelf tab.</div>
        </div>` : `<div class="center"><button class="btn btn-primary" data-act="skip">Close</button></div>`)}
      <div style="height:20px"></div>
    </div>`;

  el.querySelector('[data-act="sub"]')?.addEventListener('click', () => {
    store.consume(uses);
    toast('Shelf updated');
    closeCook();
  });
  el.querySelector('[data-act="skip"]')?.addEventListener('click', () => closeCook());

  root().innerHTML = '';
  root().appendChild(el);
}
