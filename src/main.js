import './style.css';
import { renderHome } from './home.js';
import { renderResult } from './result.js';

const HEADER_HTML = `
  <header class="site-header">
    <span class="logo">Physics<span>Sim</span></span>
    <span class="subtitle">sp202606 결과 뷰어</span>
    <div class="header-spacer"></div>
    <a class="home-link" href="/">← 모든 결과</a>
  </header>
`;

const app = document.getElementById('app');

function route() {
  const path = window.location.pathname;
  const m = path.match(/^\/results\/(\d+)$/);

  app.innerHTML = HEADER_HTML + '<div id="page"></div>';
  const page = document.getElementById('page');

  if (m) {
    const id = m[1].padStart(3, '0');
    renderResult(page, id);
  } else {
    renderHome(page);
  }
}

// Handle navigation without page reload
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href && href.startsWith('/') && !href.startsWith('//')) {
    e.preventDefault();
    history.pushState(null, '', href);
    route();
  }
});

window.addEventListener('popstate', route);
route();
