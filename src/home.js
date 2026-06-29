import { db } from './firebase.js';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';

export async function renderHome(container) {
  container.innerHTML = `
    <div class="container">
      <h1 class="page-title">Simulation Results</h1>
      <p class="page-subtitle">Physics Simulator — sp202606-web.pages.dev</p>
      <div id="results-area" class="state-msg">
        <div class="icon">⏳</div>
        <h2>불러오는 중…</h2>
      </div>
    </div>
  `;

  try {
    const q = query(collection(db, 'results'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);

    const area = document.getElementById('results-area');
    if (snap.empty) {
      area.innerHTML = `
        <div class="icon">📭</div>
        <h2>저장된 결과가 없습니다</h2>
        <p>시뮬레이터에서 ☁ CLOUD 버튼으로 결과를 저장하세요.</p>
      `;
      return;
    }

    const results = snap.docs.map(d => d.data());
    area.className = 'result-grid';
    area.innerHTML = results.map(r => cardHTML(r)).join('');
  } catch (err) {
    const area = document.getElementById('results-area');
    area.innerHTML = `
      <div class="icon">⚠️</div>
      <h2>불러오기 실패</h2>
      <p style="color:var(--muted)">${err.message}</p>
    `;
  }
}

function levelClass(level) {
  if (!level || level === '—') return '';
  const l = level.toLowerCase();
  if (l.includes('withstood') || l === 'none') return 'level-withstood';
  if (l.includes('destroy') || l.includes('catastroph')) return 'level-destroyed';
  return 'level-damaged';
}

function fmt(n, digits = 1) {
  return n != null ? (+n).toFixed(digits) : '—';
}

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso.slice(0, 16).replace('T', ' '); }
}

function cardHTML(r) {
  const s = r.summary || {};
  const lvl = s.destructionLevel || '—';
  return `
    <a class="result-card" href="/results/${r.id}">
      <div class="card-id">#${r.id}</div>
      <div class="card-label">${r.label || 'Simulation'}</div>
      <div class="card-stats">
        <div class="stat">
          <span class="stat-val">${fmt(s.impactVelocity)} m/s</span>
          <span class="stat-key">Impact Vel.</span>
        </div>
        <div class="stat">
          <span class="stat-val">${fmt(s.terminalVelocity)} m/s</span>
          <span class="stat-key">Terminal Vel.</span>
        </div>
        <div class="stat">
          <span class="stat-val">${fmt(s.fallTime)} s</span>
          <span class="stat-key">Fall Time</span>
        </div>
        <div class="stat">
          <span class="stat-val">${fmt((s.impactEnergy || 0) / 1000, 1)} kJ</span>
          <span class="stat-key">KE</span>
        </div>
      </div>
      ${lvl !== '—' ? `<span class="card-level ${levelClass(lvl)}">${lvl}</span>` : ''}
      <div class="card-date">${fmtDate(r.createdAt)}</div>
    </a>
  `;
}
