import {initStudioMotion} from './studio-motion.js';
initStudioMotion();

// Workspace navigation only. Map generation and export remain owned by app.js.
const sidebar = document.getElementById('studioNavigation');
const mainWrap = document.querySelector('.main-wrap');
const openNavigation = document.getElementById('openNavigation');
const closeNavigation = document.getElementById('closeNavigation');
const backdrop = document.getElementById('navigationBackdrop');
const compactNavigation = window.matchMedia('(max-width: 1050px)');
const navigationItems = [...sidebar.querySelectorAll('.nav-item[data-nav]')];
let drawerOpen = false;

function setNavigation(open, restoreFocus = false) {
  drawerOpen = compactNavigation.matches && open;
  sidebar.classList.toggle('is-open', drawerOpen);
  sidebar.inert = compactNavigation.matches && !drawerOpen;
  mainWrap.inert = drawerOpen;
  backdrop.hidden = !drawerOpen;
  document.body.classList.toggle('navigation-open', drawerOpen);
  openNavigation.setAttribute('aria-expanded', String(drawerOpen));
  if (drawerOpen) {
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-modal', 'true');
  } else {
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
  }
  if (restoreFocus && compactNavigation.matches) openNavigation.focus();
}

openNavigation.addEventListener('click', () => {
  setNavigation(true);
  closeNavigation.focus();
});
closeNavigation.addEventListener('click', () => setNavigation(false, true));
backdrop.addEventListener('click', () => setNavigation(false, true));
compactNavigation.addEventListener('change', () => {
  const focusedElement = document.activeElement;
  const focusedInDrawer = sidebar.contains(document.activeElement);
  setNavigation(false, focusedInDrawer);
  if (!compactNavigation.matches && (focusedElement === closeNavigation || focusedElement === openNavigation)) {
    sidebar.querySelector('.nav-item.active')?.focus();
  }
});
sidebar.addEventListener('keydown', event => {
  if (!drawerOpen) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    setNavigation(false, true);
  }
  if (event.key !== 'Tab') return;
  const focusable = [...sidebar.querySelectorAll('a[href], button:not(:disabled)')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// app.js focuses the destination heading after a nav click. Closing the drawer
// in capture phase first makes that heading available to assistive technology.
sidebar.addEventListener('click', event => {
  if (event.target.closest('[data-nav], .brand')) setNavigation(false);
}, true);
sidebar.querySelector('.brand').addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigationItems.find(item => item.dataset.nav === 'generator')?.click();
});
setNavigation(false);

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  setNavigation(false);
  const main = document.getElementById('main');
  main.focus({ preventScroll: true });
  main.scrollIntoView({ block: 'start', behavior: 'instant' });
});

document.querySelectorAll('[data-studio-scroll]').forEach(button => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.studioScroll);
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
});

const searchDialog = document.getElementById('viewSearchDialog');
const searchInput = document.getElementById('viewSearchInput');
const searchResults = document.getElementById('viewSearchResults');
const searchEmpty = document.getElementById('viewSearchEmpty');
const searchStatus = document.getElementById('viewSearchStatus');
let searchReturnFocus;
const searchTerms = {
  bot: 'idee ideen bot konzept briefing',
  trends: 'markt recherche charts roblox inspiration',
  references: 'referenz vorbild inspiration',
  generator: 'bauen bauplan welt design konfigurieren tycoon obby',
  maps: 'gespeichert projekt öffnen sammlung import',
  improve: 'optimieren verbessern überarbeiten',
  quality: 'qualität check prüfung bericht geometrie performance',
  lab: 'test spieltest labor kaufplaner spieler',
  debug: 'fehler skript log output diagnose',
  shop: 'robux produkte shop monetarisierung',
  publish: 'veröffentlichen export studio download herunterladen',
  guide: 'hilfe anleitung schritt start einstieg',
};
const normalize = value => value.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function renderSearch() {
  const query = normalize(searchInput.value.trim());
  const matches = navigationItems.filter(item => {
    const label = item.querySelector('span').textContent;
    return normalize(`${label} ${searchTerms[item.dataset.nav] || ''}`).includes(query);
  });
  searchResults.replaceChildren();
  for (const item of matches) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'command-result';
    button.append(item.querySelector('svg').cloneNode(true));
    const label = document.createElement('span');
    label.textContent = item.querySelector('span').textContent;
    button.append(label);
    const detail = document.createElement('small');
    detail.textContent = item.classList.contains('active') ? 'Aktuelle Ansicht' : 'Öffnen ↗';
    button.append(detail);
    button.addEventListener('click', () => {
      // Let app.js preserve its regular navigation, refresh, and focus behavior.
      searchReturnFocus = null;
      searchDialog.close();
      item.click();
    });
    searchResults.append(button);
  }
  searchEmpty.hidden = matches.length > 0;
  searchStatus.textContent = `${matches.length} ${matches.length === 1 ? 'Ansicht' : 'Ansichten'} gefunden.`;
}

function openSearch() {
  if (searchDialog.open) return;
  searchReturnFocus = drawerOpen ? openNavigation : document.activeElement;
  setNavigation(false);
  searchInput.value = '';
  renderSearch();
  searchDialog.showModal();
  searchInput.focus();
}

document.getElementById('openViewSearch').addEventListener('click', openSearch);
searchInput.addEventListener('input', renderSearch);
searchInput.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const results = [...searchResults.querySelectorAll('button')];
    if (!results.length) return;
    event.preventDefault();
    (event.key === 'ArrowDown' ? results[0] : results.at(-1)).focus();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    searchResults.querySelector('button')?.click();
  }
});
searchResults.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const buttons = [...searchResults.querySelectorAll('button')];
  const current = buttons.indexOf(document.activeElement);
  if (current === -1) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
    : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next]?.focus();
});
searchDialog.addEventListener('close', () => {
  if (searchReturnFocus?.isConnected) searchReturnFocus.focus();
});
searchDialog.addEventListener('click', event => {
  const bounds = searchDialog.getBoundingClientRect();
  if (event.target === searchDialog && (event.clientX < bounds.left || event.clientX > bounds.right
    || event.clientY < bounds.top || event.clientY > bounds.bottom)) searchDialog.close();
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (searchDialog.open) searchDialog.close();
    else openSearch();
  }
});

if (/Mac|iPhone|iPad/.test(navigator.platform)) {
  document.querySelector('#openViewSearch kbd').textContent = '⌘ K';
}
