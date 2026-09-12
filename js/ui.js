// Tiny DOM helpers. No framework — this app should still work in five years.

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** h`<div>...</div>` -> Element. Interpolations are escaped unless wrapped in raw(). */
export function h(strings, ...vals) {
  const html = strings.reduce((out, s, i) => {
    const v = vals[i - 1];
    return out + (v && v.__raw ? v.html : esc(v)) + s;
  });
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export const raw = html => ({ __raw: true, html });
export const rawJoin = (arr, sep = '') => raw(arr.join(sep));

let toastTimer;
export function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

export const mmss = s => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

export function minsText(m) {
  if (m < 60) return `${m} min`;
  const h1 = Math.floor(m / 60), r = m % 60;
  return r ? `${h1}h ${r}m` : `${h1}h`;
}

export function buzz(pattern = [90]) {
  try { navigator.vibrate?.(pattern); } catch {}
}

/** a short chime, so you can hear a timer finish from the next room */
export function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.22, 0.44].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 1046 : 784;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.25);
    });
    setTimeout(() => ctx.close(), 1400);
  } catch {}
}

/** which meal is it, roughly */
export function mealNow(d = new Date()) {
  const hr = d.getHours();
  if (hr < 11) return 'breakfast';
  if (hr < 16) return 'lunch';
  if (hr < 22) return 'dinner';
  return 'snack';
}

export function greeting(d = new Date()) {
  const hr = d.getHours();
  if (hr < 5)  return 'Late night';
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Afternoon';
  if (hr < 22) return 'Evening';
  return 'Late night';
}
