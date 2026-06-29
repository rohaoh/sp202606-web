export function drawChart(canvas, result, tab) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 800;
  const H = canvas.offsetHeight || 220;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, W, H);

  const frames = result.frames;
  if (!frames || frames.length < 2) return;

  const PAD = { top: 18, right: 30, bottom: 36, left: 62 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;
  const tMax = frames[frames.length - 1].t || 1;

  let yFn, yLabel, lineColor;
  switch (tab) {
    case 'height':
      yFn = f => f.h; yLabel = 'Height (m)'; lineColor = '#3fb950'; break;
    case 'acceleration':
      yFn = f => f.a; yLabel = 'Acceleration (m/s²)'; lineColor = '#f85149'; break;
    case 'density':
      yFn = f => f.rho || 0; yLabel = 'Air Density (kg/m³)'; lineColor = '#a371f7'; break;
    default:
      yFn = f => Math.abs(f.v); yLabel = 'Velocity (m/s)'; lineColor = '#58a6ff';
  }

  const yVals = frames.map(yFn);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const yRange = yMax - yMin || 1;

  const tx = t => PAD.left + (t / tMax) * pw;
  const ty = y => PAD.top + ph - ((y - yMin) / yRange) * ph;

  // grid
  ctx.strokeStyle = '#21262d';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const yp = PAD.top + (i / 4) * ph;
    ctx.beginPath(); ctx.moveTo(PAD.left, yp); ctx.lineTo(PAD.left + pw, yp); ctx.stroke();
    const val = yMax - (i / 4) * yRange;
    ctx.fillStyle = '#6e7681';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(val > 100 ? 0 : 1), PAD.left - 4, yp + 4);
  }
  for (let i = 0; i <= 4; i++) {
    const xp = PAD.left + (i / 4) * pw;
    ctx.beginPath(); ctx.moveTo(xp, PAD.top); ctx.lineTo(xp, PAD.top + ph); ctx.stroke();
    const t = (i / 4) * tMax;
    ctx.fillStyle = '#6e7681';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t.toFixed(1) + 's', xp, PAD.top + ph + 14);
  }

  // terminal velocity reference line
  if (tab === 'velocity' && result.summary?.terminalVelocity) {
    const vtY = ty(result.summary.terminalVelocity);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#f0a500';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD.left, vtY); ctx.lineTo(PAD.left + pw, vtY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f0a500';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Vt', PAD.left + pw + 2, vtY + 4);
  }

  // main trajectory line
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([]);
  frames.forEach((f, i) => {
    const x = tx(f.t), y = ty(yFn(f));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // axis labels
  ctx.fillStyle = '#8b949e';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Time (s)', PAD.left + pw / 2, H - 4);
  ctx.save();
  ctx.translate(10, PAD.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}
