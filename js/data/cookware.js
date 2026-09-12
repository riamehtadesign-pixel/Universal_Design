// Pots, pans and what "medium heat" actually means on an induction dial.

export const COOKWARE = [
  { id: 'nonstick_pan', name: 'Non-stick frying pan', emoji: '🍳', hint: 'Eggs, toast, stir-fries, anything shallow', fallback: ['kadai', 'tawa'] },
  { id: 'kadai',        name: 'Kadai / wok',          emoji: '🥘', hint: 'Deep frying, sabzi, fried rice, big tosses', fallback: ['nonstick_pan', 'pot'] },
  { id: 'saucepan',     name: 'Small saucepan',       emoji: '🫕', hint: 'Boiling 1–2 eggs, milk, sauces, instant noodles', fallback: ['pot', 'kadai'] },
  { id: 'pot',          name: 'Big pot',              emoji: '🍲', hint: 'Pasta, rice, dal, soup', fallback: ['kadai', 'saucepan'] },
  { id: 'tawa',         name: 'Flat tawa / griddle',  emoji: '🫓', hint: 'Roti, paratha, grilled sandwiches, dosa', fallback: ['nonstick_pan'] },
  { id: 'cooker',       name: 'Pressure cooker',      emoji: '⏲️', hint: 'Dal, rajma, chana in a few whistles', fallback: ['pot'] },
  { id: 'kettle',       name: 'Electric kettle',      emoji: '☕', hint: 'Hot water fast — speeds up pasta and noodles', fallback: [] },
  { id: 'blender',      name: 'Mixer / blender',      emoji: '🥤', hint: 'Smoothies, chutney, soups', fallback: [] },
  { id: 'microwave',    name: 'Microwave',            emoji: '📻', hint: 'Reheating, melting butter, quick oats', fallback: [] },
  { id: 'oven',         name: 'Oven / air fryer',     emoji: '🔥', hint: 'Roasting veg, baking, fries', fallback: [] },
  { id: 'toaster',      name: 'Toaster',              emoji: '🍞', hint: 'Toast without using a pan', fallback: ['tawa', 'nonstick_pan'] },
];
export const CW_BY_ID = Object.fromEntries(COOKWARE.map(c => [c.id, c]));

// Heat levels, as a fraction of your hob's maximum.
export const HEAT = {
  low:    { name: 'Low',         frac: 0.30, why: 'gentle — simmering, melting, keeping warm' },
  medium: { name: 'Medium',      frac: 0.55, why: 'the everyday setting — onions, eggs, sautéing' },
  mhigh:  { name: 'Medium-high', frac: 0.75, why: 'browning and reducing without burning' },
  high:   { name: 'High',        frac: 1.00, why: 'boiling water, searing, fast stir-fries' },
  off:    { name: 'Off',         frac: 0,    why: 'heat off — residual heat is enough' },
};

/** "Medium (dial 5 of 9)" or "Medium (~1100W)" — tuned to the user's own hob. */
export function heatText(level, hob) {
  const h = HEAT[level] || HEAT.medium;
  if (level === 'off') return 'Heat off';
  const max = Number(hob?.dialMax) || 9;
  if (hob?.dialMode === 'watts') {
    const w = Math.round((max * h.frac) / 100) * 100;
    return `${h.name} (~${w}W)`;
  }
  return `${h.name} (dial ${Math.max(1, Math.round(max * h.frac))} of ${max})`;
}

/** What you'll actually use for a recipe, given what you own. */
export function resolveCookware(needed = [], owned = []) {
  const have = new Set(owned);
  return needed.map(id => {
    const want = CW_BY_ID[id];
    if (!want) return { id, name: id, emoji: '🍳', ok: true };
    if (have.has(id) || !owned.length) return { ...want, ok: true };
    const sub = (want.fallback || []).find(f => have.has(f));
    return sub
      ? { ...CW_BY_ID[sub], ok: true, insteadOf: want.name }
      : { ...want, ok: false };
  });
}
