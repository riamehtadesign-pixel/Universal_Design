// The shelf library: every food item you can log, grouped into visual shelves.
// unit: pc | clove | slice | g | ml | stock  ("stock" = jar/bottle you track as Have / Low / Out)

export const UNITS = {
  pc:    { label: '',      step: 1,   short: n => `${n}`         },
  clove: { label: 'cloves',step: 1,   short: n => `${n}`         },
  slice: { label: 'slices',step: 1,   short: n => `${n}`         },
  g:     { label: 'g',     step: 50,  short: n => `${n}g`        },
  ml:    { label: 'ml',    step: 100, short: n => n >= 1000 ? `${(n/1000).toFixed(1)}L` : `${n}ml` },
  stock: { label: '',      step: 1,   short: n => (n >= 2 ? 'Have' : n === 1 ? 'Low' : '') },
};

export const CATS = [
  { id: 'veg',     name: 'Vegetables',       emoji: '🥬' },
  { id: 'fruit',   name: 'Fruit & Citrus',   emoji: '🍋' },
  { id: 'herb',    name: 'Fresh herbs',      emoji: '🌿' },
  { id: 'protein', name: 'Eggs, meat & tofu',emoji: '🥚' },
  { id: 'dairy',   name: 'Dairy',            emoji: '🥛' },
  { id: 'carb',    name: 'Grains & carbs',   emoji: '🍚' },
  { id: 'legume',  name: 'Dals & beans',     emoji: '🫘' },
  { id: 'sauce',   name: 'Sauces & vinegars',emoji: '🧴' },
  { id: 'spice',   name: 'Spices & powders', emoji: '🧂' },
  { id: 'oil',     name: 'Oils & fats',      emoji: '🫒' },
  { id: 'nut',     name: 'Nuts & seeds',     emoji: '🥜' },
  { id: 'sweet',   name: 'Sweet things',     emoji: '🍯' },
  { id: 'tin',     name: 'Tins & packets',   emoji: '🥫' },
  { id: 'freeze',  name: 'Freezer',          emoji: '🧊' },
];

const RAW = [
  // ---- vegetables ----
  ['onion',       'Onion',          '🧅', 'veg', 'pc'],
  ['spring_onion','Spring onion',   '🌱', 'veg', 'pc'],
  ['garlic',      'Garlic',         '🧄', 'veg', 'clove'],
  ['ginger',      'Ginger',         '🫚', 'veg', 'g'],
  ['tomato',      'Tomato',         '🍅', 'veg', 'pc'],
  ['potato',      'Potato',         '🥔', 'veg', 'pc'],
  ['sweet_potato','Sweet potato',   '🍠', 'veg', 'pc'],
  ['carrot',      'Carrot',         '🥕', 'veg', 'pc'],
  ['capsicum',    'Capsicum',       '🫑', 'veg', 'pc'],
  ['chilli',      'Green chilli',   '🌶️', 'veg', 'pc'],
  ['mushroom',    'Mushrooms',      '🍄', 'veg', 'g'],
  ['spinach',     'Spinach',        '🥬', 'veg', 'g'],
  ['cabbage',     'Cabbage',        '🥬', 'veg', 'g'],
  ['cauliflower', 'Cauliflower',    '🥦', 'veg', 'g'],
  ['broccoli',    'Broccoli',       '🥦', 'veg', 'g'],
  ['beans_green', 'Green beans',    '🫛', 'veg', 'g'],
  ['peas',        'Peas',           '🫛', 'veg', 'g'],
  ['corn',        'Sweetcorn',      '🌽', 'veg', 'g'],
  ['zucchini',    'Zucchini',       '🥒', 'veg', 'pc'],
  ['cucumber',    'Cucumber',       '🥒', 'veg', 'pc'],
  ['eggplant',    'Brinjal',        '🍆', 'veg', 'pc'],
  ['pumpkin',     'Pumpkin',        '🎃', 'veg', 'g'],
  ['lettuce',     'Lettuce',        '🥗', 'veg', 'g'],
  ['beetroot',    'Beetroot',       '🟣', 'veg', 'pc'],

  // ---- fruit ----
  ['lemon',   'Lemon',    '🍋', 'fruit', 'pc'],
  ['banana',  'Banana',   '🍌', 'fruit', 'pc'],
  ['apple',   'Apple',    '🍎', 'fruit', 'pc'],
  ['orange',  'Orange',   '🍊', 'fruit', 'pc'],
  ['mango',   'Mango',    '🥭', 'fruit', 'pc'],
  ['avocado', 'Avocado',  '🥑', 'fruit', 'pc'],
  ['berries', 'Berries',  '🫐', 'fruit', 'g'],
  ['dates',   'Dates',    '🌴', 'fruit', 'g'],

  // ---- fresh herbs ----
  ['coriander', 'Coriander',  '🌿', 'herb', 'stock'],
  ['mint',      'Mint',       '🌿', 'herb', 'stock'],
  ['curry_leaf','Curry leaves','🍃','herb', 'stock'],
  ['basil',     'Basil',      '🌿', 'herb', 'stock'],
  ['parsley',   'Parsley',    '🌿', 'herb', 'stock'],

  // ---- protein ----
  ['egg',      'Eggs',        '🥚', 'protein', 'pc'],
  ['paneer',   'Paneer',      '🧆', 'protein', 'g'],
  ['tofu',     'Tofu',        '🧈', 'protein', 'g'],
  ['chicken',  'Chicken',     '🍗', 'protein', 'g'],
  ['prawns',   'Prawns',      '🦐', 'protein', 'g'],
  ['fish',     'Fish fillet', '🐟', 'protein', 'g'],
  ['mince',    'Mince',       '🥩', 'protein', 'g'],
  ['sausage',  'Sausages',    '🌭', 'protein', 'pc'],
  ['bacon',    'Bacon',       '🥓', 'protein', 'slice'],

  // ---- dairy ----
  ['milk',       'Milk',          '🥛', 'dairy', 'ml'],
  ['butter',     'Butter',        '🧈', 'dairy', 'stock'],
  ['cheese',     'Cheese',        '🧀', 'dairy', 'g'],
  ['cheese_slice','Cheese slices','🧀', 'dairy', 'slice'],
  ['curd',       'Curd / yoghurt','🥣', 'dairy', 'g'],
  ['cream',      'Cream',         '🍶', 'dairy', 'ml'],
  ['ghee',       'Ghee',          '🫙', 'dairy', 'stock'],

  // ---- grains & carbs ----
  ['rice',        'Rice (raw)',      '🍚', 'carb', 'g'],
  ['rice_cooked', 'Cooked rice',     '🍚', 'carb', 'g'],
  ['spaghetti',   'Spaghetti',       '🍝', 'carb', 'g'],
  ['pasta',       'Pasta shapes',    '🍝', 'carb', 'g'],
  ['noodles',     'Instant noodles', '🍜', 'carb', 'pc'],
  ['hakka_noodle','Hakka noodles',   '🍜', 'carb', 'g'],
  ['bread',       'Bread',           '🍞', 'carb', 'slice'],
  ['tortilla',    'Tortilla / roti',  '🫓', 'carb', 'pc'],
  ['oats',        'Oats',            '🥣', 'carb', 'g'],
  ['poha',        'Poha',            '🍚', 'carb', 'g'],
  ['semolina',    'Rava / semolina', '🥣', 'carb', 'g'],
  ['flour',       'Atta / flour',    '🌾', 'carb', 'g'],
  ['besan',       'Besan',           '🌾', 'carb', 'g'],
  ['couscous',    'Couscous',        '🥣', 'carb', 'g'],
  ['bun',         'Burger bun',      '🍔', 'carb', 'pc'],

  // ---- dals & beans ----
  ['toor_dal',  'Toor dal',      '🫘', 'legume', 'g'],
  ['moong_dal', 'Moong dal',     '🫘', 'legume', 'g'],
  ['masoor_dal','Masoor dal',    '🫘', 'legume', 'g'],
  ['chana',     'Chickpeas',     '🫘', 'legume', 'g'],
  ['rajma',     'Kidney beans',  '🫘', 'legume', 'g'],
  ['lentil_can', 'Beans (tin)',  '🥫', 'legume', 'pc'],

  // ---- sauces ----
  ['soy_sauce',   'Soy sauce',      '🍶', 'sauce', 'stock'],
  ['chilli_sauce','Chilli sauce',   '🌶️', 'sauce', 'stock'],
  ['sriracha',    'Sriracha',       '🌶️', 'sauce', 'stock'],
  ['ketchup',     'Ketchup',        '🍅', 'sauce', 'stock'],
  ['mayo',        'Mayonnaise',     '🥚', 'sauce', 'stock'],
  ['mustard',     'Mustard',        '🟡', 'sauce', 'stock'],
  ['vinegar',     'Vinegar',        '🧴', 'sauce', 'stock'],
  ['oyster_sauce','Oyster sauce',   '🦪', 'sauce', 'stock'],
  ['sesame_oil',  'Sesame oil',     '🫗', 'sauce', 'stock'],
  ['pasta_sauce', 'Pasta sauce',    '🥫', 'sauce', 'stock'],
  ['peanut_butter','Peanut butter', '🥜', 'sauce', 'stock'],
  ['hot_honey',   'Honey',          '🍯', 'sauce', 'stock'],
  ['tahini',      'Tahini / hummus','🥣', 'sauce', 'stock'],

  // ---- spices ----
  ['salt',        'Salt',            '🧂', 'spice', 'stock'],
  ['pepper',      'Black pepper',    '⚫', 'spice', 'stock'],
  ['turmeric',    'Turmeric',        '🟡', 'spice', 'stock'],
  ['chilli_pow',  'Chilli powder',   '🔴', 'spice', 'stock'],
  ['garlic_pow',  'Garlic powder',   '🧄', 'spice', 'stock'],
  ['onion_pow',   'Onion powder',    '🧅', 'spice', 'stock'],
  ['cumin',       'Cumin / jeera',   '🟤', 'spice', 'stock'],
  ['coriander_pow','Coriander powder','🟫','spice', 'stock'],
  ['garam_masala','Garam masala',    '🟤', 'spice', 'stock'],
  ['mustard_seed','Mustard seeds',   '⚫', 'spice', 'stock'],
  ['hing',        'Hing',            '🟡', 'spice', 'stock'],
  ['chaat_masala','Chaat masala',    '🟠', 'spice', 'stock'],
  ['oregano',     'Oregano / herbs', '🌿', 'spice', 'stock'],
  ['chilli_flakes','Chilli flakes',  '🌶️', 'spice', 'stock'],
  ['paprika',     'Paprika',         '🔴', 'spice', 'stock'],
  ['cinnamon',    'Cinnamon',        '🟫', 'spice', 'stock'],
  ['bay_leaf',    'Bay leaf',        '🍃', 'spice', 'stock'],
  ['stock_cube',  'Stock cube',      '🧊', 'spice', 'stock'],

  // ---- oils ----
  ['oil',        'Cooking oil',  '🫗', 'oil', 'stock'],
  ['olive_oil',  'Olive oil',    '🫒', 'oil', 'stock'],

  // ---- nuts & seeds ----
  ['peanuts',      'Peanuts',      '🥜', 'nut', 'g'],
  ['cashew',       'Cashews',      '🥜', 'nut', 'g'],
  ['almond',       'Almonds',      '🌰', 'nut', 'g'],
  ['walnut',       'Walnuts',      '🌰', 'nut', 'g'],
  ['sesame_seed',  'Sesame seeds', '⚪', 'nut', 'stock'],
  ['sunflower_seed','Sunflower seeds','🌻','nut', 'stock'],
  ['chia',         'Chia seeds',   '⚫', 'nut', 'stock'],
  ['flax',         'Flax seeds',   '🟤', 'nut', 'stock'],
  ['pumpkin_seed', 'Pumpkin seeds','🎃', 'nut', 'stock'],

  // ---- sweet ----
  ['sugar',     'Sugar',       '🍬', 'sweet', 'stock'],
  ['jaggery',   'Jaggery',     '🟤', 'sweet', 'stock'],
  ['chocolate', 'Chocolate',   '🍫', 'sweet', 'g'],
  ['jam',       'Jam',         '🍓', 'sweet', 'stock'],
  ['cocoa',     'Cocoa powder','🟤', 'sweet', 'stock'],

  // ---- tins & packets ----
  ['tomato_tin',  'Chopped tomatoes (tin)', '🥫', 'tin', 'pc'],
  ['coconut_milk','Coconut milk (tin)',     '🥫', 'tin', 'pc'],
  ['tuna_tin',    'Tuna (tin)',             '🐟', 'tin', 'pc'],
  ['corn_tin',    'Sweetcorn (tin)',        '🥫', 'tin', 'pc'],
  ['olives',      'Olives',                 '🫒', 'tin', 'stock'],
  ['pickle',      'Pickle / achaar',        '🥒', 'tin', 'stock'],
  ['papad',       'Papad',                  '🟠', 'tin', 'pc'],
  ['chips',       'Chips / namkeen',        '🍟', 'tin', 'stock'],

  // ---- freezer ----
  ['frozen_peas',  'Frozen peas',      '🫛', 'freeze', 'g'],
  ['frozen_veg',   'Frozen veg mix',   '🧊', 'freeze', 'g'],
  ['frozen_paratha','Frozen paratha',  '🫓', 'freeze', 'pc'],
  ['frozen_fries', 'Frozen fries',     '🍟', 'freeze', 'g'],
  ['ice_cream',    'Ice cream',        '🍨', 'freeze', 'stock'],
];

export const CATALOG = RAW.map(([id, name, emoji, cat, unit]) => ({ id, name, emoji, cat, unit }));
export const BY_ID = Object.fromEntries(CATALOG.map(i => [i.id, i]));

export const item = id => BY_ID[id] || { id, name: id.replace(/_/g, ' '), emoji: '🍽️', cat: 'tin', unit: 'stock' };

/** "2 onions", "150g paneer", "soy sauce" */
export function amountText(id, qty) {
  const it = item(id);
  if (it.unit === 'stock' || !qty) return it.name.toLowerCase();
  const u = UNITS[it.unit];
  if (it.unit === 'g' || it.unit === 'ml') return `${u.short(qty)} ${it.name.toLowerCase()}`;
  const plural = qty > 1 && !/s$/.test(it.name) ? 's' : '';
  return `${qty} ${it.name.toLowerCase()}${plural}`;
}

/** Let people add things the library doesn't know about (kept in their own storage). */
export function registerItems(list = []) {
  for (const it of list) {
    if (!it?.id) continue;
    const norm = { unit: 'stock', cat: 'tin', emoji: '🍽️', ...it, custom: true };
    BY_ID[norm.id] = norm;
    if (!CATALOG.some(x => x.id === norm.id)) CATALOG.push(norm);
  }
}
