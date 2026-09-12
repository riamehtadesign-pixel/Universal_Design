// Optional: ask Claude to invent recipes from exactly what is on your shelf.
//
// Your API key is stored only in this browser's localStorage and is sent only to
// api.anthropic.com. The browser header below is what lets a page call the API
// directly with no server of your own — fine for a personal app on your phone,
// but if you ever share this app, put a tiny proxy in front instead so the key
// is never on the device.

import { item, amountText, UNITS } from './data/catalog.js';
import { CW_BY_ID } from './data/cookware.js';
import * as store from './store.js';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const HEAT = ['off', 'low', 'medium', 'mhigh', 'high'];

export const hasKey = () => !!store.get().aiKey;

export async function askClaude({ maxMins = 0, meal = '' } = {}) {
  const st = store.get();
  const key = st.aiKey;
  if (!key) throw new Error('Add your Anthropic API key on the Kitchen tab first.');

  const ids = Object.keys(st.pantry);
  if (!ids.length) throw new Error('Put something on your shelf first.');

  const shelf = ids.map(id => {
    const it = item(id);
    const n = st.pantry[id];
    return it.unit === 'stock'
      ? `${it.name}${n === 1 ? ' (running low)' : ''}`
      : amountText(id, n);
  }).join(', ');

  const pans = (st.cookware || []).map(c => CW_BY_ID[c]?.name || c).join(', ') || 'one frying pan';
  const hob = st.hob?.dialMode === 'watts'
    ? `induction hob, dial in watts up to ${st.hob.dialMax}W`
    : `induction hob with heat levels 1 to ${st.hob?.dialMax || 9}`;

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['recipes'],
    properties: {
      recipes: {
        type: 'array', minItems: 2, maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'emoji', 'blurb', 'mins', 'serves', 'meal', 'diet', 'cookware', 'need', 'steps', 'serve'],
          properties: {
            name: { type: 'string' },
            emoji: { type: 'string' },
            blurb: { type: 'string', description: 'one short line on why this is worth making' },
            mins: { type: 'integer' },
            serves: { type: 'integer' },
            meal: { type: 'array', items: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'drink'] } },
            diet: { type: 'string', enum: ['vegan', 'veg', 'egg', 'meat'] },
            cookware: { type: 'array', items: { type: 'string', enum: Object.keys(CW_BY_ID) } },
            need: {
              type: 'array', minItems: 1,
              items: {
                type: 'object', additionalProperties: false, required: ['id'],
                properties: {
                  id: { type: 'string', enum: ids },
                  q: { type: 'number', description: 'amount in the unit given for that item' },
                  prep: { type: 'string', description: 'how to cut or prepare it, with the amount' },
                },
              },
            },
            opt: {
              type: 'array',
              items: {
                type: 'object', additionalProperties: false, required: ['id'],
                properties: { id: { type: 'string', enum: ids }, q: { type: 'number' }, use: { type: 'string' } },
              },
            },
            steps: {
              type: 'array', minItems: 3, maxItems: 8,
              items: {
                type: 'object', additionalProperties: false, required: ['do'],
                properties: {
                  do: { type: 'string', description: 'one clear instruction, plain words, no more than 2 sentences' },
                  heat: { type: 'string', enum: HEAT },
                  t: { type: 'integer', description: 'seconds this step takes, if it is worth timing' },
                  tip: { type: 'string', description: 'the one thing beginners get wrong here' },
                },
              },
            },
            serve: { type: 'string' },
          },
        },
      },
    },
  };

  const prompt = [
    `I am a beginner cook. Invent 2–3 recipes I can make RIGHT NOW from only what is on my shelf.`,
    ``,
    `On my shelf: ${shelf}`,
    `I cook on: ${hob}`,
    `I own: ${pans}`,
    `Cooking for: ${st.servings} ${st.servings > 1 ? 'people' : 'person'}`,
    st.diet && st.diet !== 'any' ? `Diet: ${({ egg: 'vegetarian but egg is fine', veg: 'vegetarian, no egg', vegan: 'vegan' })[st.diet] || st.diet}` : '',
    maxMins ? `Must be done in ${maxMins} minutes or less.` : '',
    meal ? `It should suit: ${meal}.` : '',
    ``,
    `Rules:`,
    `- Use ONLY items from my shelf. Salt, pepper and water you may assume only if they are listed.`,
    `- Every "need" id must be one of my shelf ids. Put amounts in "q" using that item's own unit.`,
    `- Steps must be short and literal: what to do, what it should look like, how long. Include a "t" in seconds wherever waiting matters.`,
    `- Heat levels are relative to my hob: low, medium, mhigh, high, or off.`,
    `- Only name cookware I actually own.`,
    `- Do not invent a recipe that needs an oven, grill or appliance I have not listed.`,
    `- Prefer things that are genuinely quick and hard to get wrong. No deep frying.`,
  ].filter(Boolean).join('\n');

  const body = {
    model: st.aiModel || 'claude-opus-5',
    max_tokens: 8000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: prompt }],
  };

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('No connection to the API. The rest of the app still works offline.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('That API key was rejected. Check it on the Kitchen tab.');
    if (res.status === 429) throw new Error('Rate limited — try again in a moment.');
    if (res.status >= 500) throw new Error('The API is having a moment. Try again.');
    throw new Error(`API error ${res.status}: ${text.slice(0, 140)}`);
  }

  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('Claude declined that one. Try again.');

  const parsed = data.parsed_output || pickJson(data.content);
  const list = Array.isArray(parsed?.recipes) ? parsed.recipes : [];
  if (!list.length) throw new Error('Got a reply but no recipes in it. Try again.');

  return list.map(toRecipe).filter(Boolean);
}

function pickJson(content = []) {
  const texts = content.filter(b => b.type === 'text' && b.text?.trim()).map(b => b.text);
  for (const t of texts.reverse()) {
    try { return JSON.parse(t); } catch {}
    const m = t.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
  }
  return null;
}

/** shape Claude's answer into the same object the built-in recipes use */
function toRecipe(r) {
  if (!r?.name || !Array.isArray(r.steps) || !r.steps.length) return null;
  const slug = String(r.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 28);
  return {
    id: `ai_${slug}_${Date.now().toString(36).slice(-4)}`,
    ai: true,
    name: String(r.name).slice(0, 70),
    emoji: (r.emoji || '✨').slice(0, 3),
    blurb: String(r.blurb || 'Made up on the spot from your shelf.').slice(0, 180),
    mins: clamp(r.mins, 3, 180, 20),
    serves: clamp(r.serves, 1, 8, 1),
    meal: Array.isArray(r.meal) && r.meal.length ? r.meal : ['lunch', 'dinner'],
    diet: ['vegan', 'veg', 'egg', 'meat'].includes(r.diet) ? r.diet : 'egg',
    cookware: (r.cookware || []).filter(c => CW_BY_ID[c]),
    need: (r.need || []).filter(g => g?.id).map(g => ({ id: g.id, q: num(g.q), prep: str(g.prep) })),
    opt: (r.opt || []).filter(g => g?.id).map(g => ({ id: g.id, q: num(g.q), use: str(g.use) })),
    steps: r.steps.filter(s => s?.do).slice(0, 10).map(s => ({
      do: String(s.do).slice(0, 400),
      heat: HEAT.includes(s.heat) ? s.heat : undefined,
      t: s.t ? clamp(s.t, 5, 3600, 0) : undefined,
      tip: str(s.tip),
    })),
    serve: str(r.serve),
  };
}

const clamp = (v, lo, hi, dflt) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, Math.round(+v))) : dflt);
const num = v => (Number.isFinite(+v) && +v > 0 ? +v : undefined);
const str = v => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 300) : undefined);
