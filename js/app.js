// Boot, tabs, and the bits of plumbing that hold the screens together.

import { toast } from './ui.js';
import { registerItems } from './data/catalog.js';
import * as store from './store.js';
import { home, resetIdeas } from './views/home.js';
import { shelf, resetShelf } from './views/shelf.js';
import { buy } from './views/buy.js';
import { kitchen, applyTheme } from './views/kitchen.js';
import { isCooking, closeCook } from './views/cook.js';

const TABS = {
  home:    { title: 'Pantry',       render: home },
  shelf:   { title: 'Your shelf',   render: shelf },
  list:    { title: 'Buy list',     render: buy },
  kitchen: { title: 'Your kitchen', render: kitchen },
};

const screen = document.getElementById('screen');
const titleEl = document.getElementById('title');
let tab = 'home';

function go(next, { push = true } = {}) {
  if (!TABS[next]) next = 'home';
  tab = next;
  if (push && location.hash !== `#/${next}`) history.pushState({ tab: next }, '', `#/${next}`);

  titleEl.textContent = TABS[tab].title;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('is-on', b.dataset.tab === tab));
  screen.scrollTop = 0;
  window.scrollTo({ top: 0 });
  TABS[tab].render(screen, go);
}

function boot() {
  // your own added items need to exist before anything reads the shelf
  registerItems(store.get().custom || []);
  applyTheme();

  document.querySelectorAll('.tab').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.tab === 'home') resetIdeas();
      if (b.dataset.tab === 'shelf') resetShelf();
      go(b.dataset.tab);
    });
  });

  window.addEventListener('popstate', e => {
    if (isCooking()) { closeCook({ fromHistory: true }); return; }
    go(fromHash(), { push: false });
  });

  // repaint the current tab whenever the data changes underneath it
  let raf = 0;
  store.subscribe(() => {
    if (isCooking() || tab !== 'home') return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => TABS.home.render(screen, go));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isCooking()) closeCook();
  });

  go(fromHash(), { push: false });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  window.addEventListener('error', e => {
    console.error(e.error || e.message);
  });
}

const fromHash = () => (location.hash.replace('#/', '') || 'home');

boot();
