// Works out what you can actually cook right now.

import { RECIPES, DIETS } from './data/recipes.js';
import { item } from './data/catalog.js';
import { resolveCookware } from './data/cookware.js';

const need = g => (g.q ?? 0);

/** scale a per-recipe quantity to the servings you want */
export function scaleQty(q, factor, unit) {
  if (!q) return q;
  const v = q * factor;
  if (unit === 'pc' || unit === 'slice' || unit === 'clove') return Math.max(1, Math.round(v));
  return Math.round(v / 5) * 5 || v;
}

/** does the shelf cover this ingredient (or one of its alternatives)? */
function covered(g, pantry, factor) {
  const opts = [g.id, ...(g.alt || [])];
  for (const id of opts) {
    const have = pantry[id] || 0;
    if (!have) continue;
    const unit = item(id).unit;
    if (unit === 'stock') return { id, swapped: id !== g.id };
    const want = scaleQty(need(g), factor, unit) || 1;
    if (have >= want) return { id, swapped: id !== g.id };
  }
  return null;
}

/**
 * Score one recipe against the shelf.
 * ready = you have everything essential.
 */
export function scoreRecipe(r, st) {
  const pantry = st.pantry || {};
  const factor = (st.servings || 1) / (r.serves || 1);
  const have = [], missing = [], swaps = [];

  for (const g of (r.need || [])) {
    const hit = covered(g, pantry, factor);
    if (hit) {
      have.push({ ...g, usedId: hit.id });
      if (hit.swapped) swaps.push({ wanted: g.id, used: hit.id });
    } else {
      missing.push(g);
    }
  }

  const optHave = (r.opt || []).filter(g => covered(g, pantry, factor));
  const total = (r.need || []).length || 1;
  const cover = have.length / total;

  const cw = resolveCookware(r.cookware || [], st.cookware || []);
  const cwMissing = cw.filter(c => !c.ok);

  let score = cover * 100;
  score += Math.min(18, optHave.length * 3);           // a well-stocked recipe scores better
  score -= missing.length * 26;                         // each gap hurts
  score -= cwMissing.length * 12;                       // can't make it without the pan
  score -= Math.max(0, (r.mins - 15)) * 0.35;           // gently prefer quick things
  if ((st.recent || []).includes(r.id)) score -= 14;    // you just ate that
  if ((st.favs || []).includes(r.id)) score += 8;

  return {
    recipe: r, ready: missing.length === 0, missing, have, swaps,
    optHave, cookware: cw, cwMissing, factor,
    score: Math.round(score),
  };
}

/**
 * Rank everything. opts: { maxMins, meal, diet, maxMissing, onlyFavs, shuffle }
 */
export function suggest(st, opts = {}) {
  const {
    maxMins = 0, meal = '', diet = st.diet || 'any',
    maxMissing = 2, onlyFavs = false, shuffle = 0, pool,
  } = opts;

  const dietRule = (DIETS.find(d => d.id === diet) || DIETS[0]).ok;
  const all = pool || [...RECIPES, ...(st.aiRecipes || [])];

  return all
    .filter(r => dietRule(r))
    .filter(r => !maxMins || r.mins <= maxMins)
    .filter(r => !meal || (r.meal || []).includes(meal))
    .filter(r => !onlyFavs || (st.favs || []).includes(r.id))
    .map(r => scoreRecipe(r, st))
    .filter(s => s.missing.length <= maxMissing)
    .map(s => ({ ...s, score: s.score + (shuffle ? jitter(s.recipe.id, shuffle) : 0) }))
    .sort((a, b) =>
      (b.ready - a.ready) ||
      (a.missing.length - b.missing.length) ||
      (b.score - a.score) ||
      (a.recipe.mins - b.recipe.mins));
}

/** small stable-per-round random nudge, so pressing the button again gives new ideas */
function jitter(id, seed) {
  let h = seed * 2654435761;
  for (let i = 0; i < id.length; i++) h = (h ^ id.charCodeAt(i)) * 16777619 >>> 0;
  return ((h % 1000) / 1000) * 13;
}

/** ingredients to take off the shelf after cooking */
export function usedItems(s) {
  const out = [];
  for (const g of s.have) {
    const it = item(g.usedId);
    out.push({ id: g.usedId, name: it.name, unit: it.unit, q: scaleQty(g.q ?? 0, s.factor, it.unit) });
  }
  for (const g of s.optHave) {
    const hit = g.id;
    const it = item(hit);
    out.push({ id: hit, name: it.name, unit: it.unit, q: scaleQty(g.q ?? 0, s.factor, it.unit) });
  }
  return out;
}
