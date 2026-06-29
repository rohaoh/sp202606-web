import { db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { drawChart } from './chart.js';
import { exportCSV, exportXLSX } from './export.js';

export async function renderResult(container, id) {
  container.innerHTML = `
    <div class="container">
      <a class="back-link" href="/">← 목록으로</a>
      <div class="state-msg">
        <div class="icon">⏳</div>
        <h2>불러오는 중…</h2>
      </div>
    </div>
  `;

  let result;
  try {
    const snap = await getDoc(doc(db, 'results', id));
    if (!snap.exists()) {
      document.querySelector('.state-msg').innerHTML = `
        <div class="icon">🔍</div>
        <h2>결과를 찾을 수 없습니다 (#${id})</h2>
        <p><a href="/">목록으로 돌아가기</a></p>
      `;
      return;
    }
    result = snap.data();
  } catch (err) {
    document.querySelector('.state-msg').innerHTML = `
      <div class="icon">⚠️</div>
      <h2>불러오기 실패</h2>
      <p style="color:var(--muted)">${err.message}</p>
    `;
    return;
  }

  document.title = `#${id} — Physics Simulator Results`;
  const s = result.summary || {};
  const p = result.settings || {};
  const shareUrl = `https://sp202606-web.pages.dev/results/${id}`;

  container.innerHTML = `
    <div class="container">
      <a class="back-link" href="/">← 목록으로</a>
      <div class="result-header">
        <div class="result-id">#${id}</div>
        <div class="result-title">${result.label || 'Simulation Result'}</div>
        <div class="result-date">${fmtDate(result.createdAt)}</div>
      </div>

      <div class="share-row">
        <div class="share-url">${shareUrl}</div>
        <button class="copy-btn" id="btn-copy">Copy</button>
      </div>

      <div class="dl-row">
        <button class="dl-btn" id="btn-dl-csv"><span class="icon">📄</span> Download CSV</button>
        <button class="dl-btn" id="btn-dl-xlsx"><span class="icon">📊</span> Download XLSX</button>
      </div>

      <div class="chart-wrap">
        <div class="chart-tabs">
          <button class="tab-btn active" data-tab="velocity">Velocity</button>
          <button class="tab-btn" data-tab="height">Height</button>
          <button class="tab-btn" data-tab="acceleration">Acceleration</button>
          <button class="tab-btn" data-tab="density">Air Density</button>
        </div>
        <canvas class="traj-chart" id="traj-canvas"></canvas>
      </div>

      <div class="detail-grid">
        <div class="card">
          <div class="card-title">Summary</div>
          <table class="kv-table">
            <tr><td>Terminal Velocity</td><td>${fmt(s.terminalVelocity)} m/s</td></tr>
            <tr><td>Impact Velocity</td><td>${fmt(s.impactVelocity)} m/s</td></tr>
            <tr><td>Fall Time</td><td>${fmt(s.fallTime)} s</td></tr>
            <tr><td>Impact Energy</td><td>${fmt((s.impactEnergy || 0) / 1000, 2)} kJ</td></tr>
            <tr><td>Destruction Level</td><td>${s.destructionLevel || '—'}</td></tr>
            <tr><td>Destruction Ratio</td><td>${fmt((s.destructionRatio || 0) * 100, 1)} %</td></tr>
            <tr><td>Lateral Drift</td><td>${fmt(s.drift, 2)} m</td></tr>
          </table>
        </div>
        <div class="card">
          <div class="card-title">Parameters</div>
          <table class="kv-table">
            <tr><td>Mass</td><td>${fmt(p.mass, 2)} kg</td></tr>
            <tr><td>Cross-section</td><td>${fmt(p.area, 4)} m²</td></tr>
            <tr><td>Drag coeff (Cd)</td><td>${fmt(p.cd, 3)}</td></tr>
            <tr><td>Drop height</td><td>${fmt(p.height)} m</td></tr>
            <tr><td>Initial velocity</td><td>${fmt(p.v0)} m/s</td></tr>
            <tr><td>Gravity</td><td>${fmt(p.gravity, 2)} m/s²</td></tr>
            <tr><td>Wind X / Z</td><td>${fmt(p.windX)} / ${fmt(p.windZ)} m/s</td></tr>
            <tr><td>Temp offset</td><td>${fmt(p.tempOffset)} °C</td></tr>
            <tr><td>Humidity</td><td>${fmt(p.humidity)} %</td></tr>
            <tr><td>Shape</td><td>${p.shape || '—'}</td></tr>
            <tr><td>Terrain</td><td>${p.terrain || 'flat'}</td></tr>
          </table>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-title">Trajectory Data</div>
        <div style="overflow-x:auto">
          <table id="frames-table" class="kv-table" style="min-width:500px">
            <thead>
              <tr style="border-bottom:1px solid var(--border)">
                <td><b>t (s)</b></td>
                <td style="text-align:right"><b>v (m/s)</b></td>
                <td style="text-align:right"><b>h (m)</b></td>
                <td style="text-align:right"><b>a (m/s²)</b></td>
                <td style="text-align:right"><b>ρ (kg/m³)</b></td>
                <td style="text-align:right"><b>Layer</b></td>
              </tr>
            </thead>
            <tbody>
              ${buildFrameRows(result.frames || [])}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Chart
  const canvas = document.getElementById('traj-canvas');
  let activeTab = 'velocity';
  function redraw() { drawChart(canvas, result, activeTab); }
  requestAnimationFrame(redraw);
  window.addEventListener('resize', redraw);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      redraw();
    });
  });

  // Download
  document.getElementById('btn-dl-csv').addEventListener('click', () => exportCSV(result, `sim-${id}.csv`));
  document.getElementById('btn-dl-xlsx').addEventListener('click', () => exportXLSX(result, `sim-${id}.xlsx`));

  // Copy URL
  document.getElementById('btn-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      const btn = document.getElementById('btn-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    } catch {}
  });
}

function fmt(n, digits = 1) {
  return n != null ? (+n).toFixed(digits) : '—';
}

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso.slice(0, 16).replace('T', ' '); }
}

function buildFrameRows(frames) {
  // Show every Nth row to keep table manageable (max 200 rows)
  const step = Math.max(1, Math.floor(frames.length / 200));
  return frames
    .filter((_, i) => i % step === 0)
    .map(f => `
      <tr>
        <td>${(+f.t).toFixed(2)}</td>
        <td style="text-align:right">${Math.abs(+f.v).toFixed(2)}</td>
        <td style="text-align:right">${(+f.h).toFixed(1)}</td>
        <td style="text-align:right">${(+f.a).toFixed(3)}</td>
        <td style="text-align:right">${(f.rho || 0).toFixed(4)}</td>
        <td style="text-align:right;color:var(--muted)">${f.atm || ''}</td>
      </tr>`)
    .join('');
}
