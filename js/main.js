// ==================== LIGHTBOX ====================
(function () {
  const overlay = document.createElement('div');
  overlay.id = 'lightbox-overlay';
  overlay.innerHTML = '<span id="lightbox-close">✕</span><img id="lightbox-img" src="" alt="">';
  document.body.appendChild(overlay);

  const img = overlay.querySelector('#lightbox-img');

  function open(src, alt) {
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('active');
    img.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.lightbox-trigger').forEach(el => {
    el.addEventListener('click', () => open(el.dataset.src || el.src || el.querySelector('img')?.src, el.dataset.alt || el.alt || ''));
  });
  overlay.addEventListener('click', e => { if (e.target === overlay || e.target.id === 'lightbox-close') close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// ==================== NAVBAR BURGER ====================
const burger = document.getElementById('burger');
const navMenu = document.getElementById('navMenu');
if (burger && navMenu) {
  burger.addEventListener('click', () => navMenu.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !navMenu.contains(e.target))
      navMenu.classList.remove('open');
  });
}

// ==================== ACTIVE NAV LINK ====================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.navbar-menu a').forEach(a => {
  if (a.getAttribute('href') === currentPage) a.classList.add('active');
});

// ==================== BACK TO TOP ====================
const btt = document.getElementById('backToTop');
if (btt) {
  window.addEventListener('scroll', () => {
    btt.classList.toggle('visible', window.scrollY > 300);
  });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ==================== NAVBAR SEARCH BUTTON ====================
const navSearchBtn = document.getElementById('navSearchBtn');
if (navSearchBtn) {
  navSearchBtn.addEventListener('click', () => {
    window.location.href = 'search.html';
  });
}

// ==================== PUBLICATION FILTERS ====================
function initPubFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn[data-year]');
  const pubItems = document.querySelectorAll('.pub-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const year = btn.dataset.year;
      pubItems.forEach(item => {
        if (year === 'all' || item.dataset.year === year) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
      updatePubCount();
    });
  });
}

function initPubSearch() {
  const input = document.getElementById('pubSearchInput');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const pubItems = document.querySelectorAll('.pub-item');
    pubItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
    updatePubCount();
  });
}

function updatePubCount() {
  const el = document.getElementById('pubCount');
  if (!el) return;
  const visible = document.querySelectorAll('.pub-item:not(.hidden)').length;
  el.textContent = `共 ${visible} 篇`;
}

initPubFilters();
initPubSearch();

// ==================== SEARCH PAGE ====================
async function initSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const resultsEl = document.getElementById('searchResults');
  const statsEl = document.getElementById('searchStats');
  if (!input || !resultsEl) return;

  let index = [];
  try {
    const resp = await fetch('data/search-index.json');
    index = await resp.json();
  } catch (e) { console.warn('Failed to load search index'); }

  // Pre-fill from URL param
  const params = new URLSearchParams(window.location.search);
  const initQ = params.get('q') || '';
  if (initQ) { input.value = initQ; doSearch(initQ); }

  function doSearch(q) {
    q = q.trim();
    if (!q) { resultsEl.innerHTML = ''; if (statsEl) statsEl.textContent = ''; return; }
    const terms = q.toLowerCase().split(/\s+/);
    const results = index.filter(item => {
      const text = (item.title + ' ' + item.body + ' ' + item.category).toLowerCase();
      return terms.every(t => text.includes(t));
    });

    if (statsEl) statsEl.textContent = `找到 ${results.length} 条结果（关键词："${q}"）`;

    if (!results.length) {
      resultsEl.innerHTML = `<div class="no-results">
        <div style="font-size:3rem;margin-bottom:16px;">🔍</div>
        <p style="font-size:1.1rem;font-weight:600;color:#1a3a5c;margin-bottom:8px;">没有找到相关内容</p>
        <p>请尝试其他关键词，如"论文"、"设备"、"成员"</p>
      </div>`;
      return;
    }

    resultsEl.innerHTML = results.map(r => {
      const hl = str => str.replace(new RegExp(`(${escapeReg(q)})`, 'gi'), '<mark>$1</mark>');
      return `<div class="search-result-item">
        <div class="result-category">${r.category}</div>
        <div class="result-title">${hl(r.title)}</div>
        <div class="result-excerpt">${hl(r.body.substring(0, 120))}…</div>
        <a class="result-link" href="${r.url}">查看详情 →</a>
      </div>`;
    }).join('');

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('q', q);
    window.history.replaceState({}, '', url);
  }

  function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  btn.addEventListener('click', () => doSearch(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(input.value); });
}

initSearch();

// ==================== COUNTER ANIMATION ====================
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (el.dataset.suffix || '');
      if (current >= target) clearInterval(timer);
    }, 25);
  });
}

const heroEl = document.querySelector('.hero');
if (heroEl && 'IntersectionObserver' in window) {
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
  });
  obs.observe(heroEl);
} else if (heroEl) {
  animateCounters();
}
