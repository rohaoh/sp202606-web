import * as XLSX from 'xlsx';

export function exportCSV(result, filename) {
  const frames = result.frames || [];
  const header = 'Time(s),Velocity(m/s),Height(m),Acceleration(m/s²),AirDensity(kg/m³),AtmLayer,HeatFlux(W/m²),SurfaceTemp(K),DriftX(m),DriftZ(m)';
  const rows = frames.map(f =>
    [f.t, Math.abs(f.v), f.h, f.a, f.rho || 0, f.atm || '', f.heatFlux || 0, f.T_surface || 0, f.px || 0, f.pz || 0].join(',')
  );
  const csv = '﻿' + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, filename || `result-${result.id}.csv`);
}

export function exportXLSX(result, filename) {
  const frames = result.frames || [];
  const ws_data = [
    ['Time(s)', 'Velocity(m/s)', 'Height(m)', 'Acceleration(m/s²)', 'AirDensity(kg/m³)', 'AtmLayer', 'HeatFlux(W/m²)', 'SurfaceTemp(K)', 'DriftX(m)', 'DriftZ(m)'],
    ...frames.map(f => [
      f.t, Math.abs(f.v), f.h, f.a, f.rho || 0, f.atm || '', f.heatFlux || 0, f.T_surface || 0, f.px || 0, f.pz || 0,
    ]),
  ];

  const summaryData = result.summary ? [
    ['--- Summary ---'],
    ['Terminal Velocity (m/s)', result.summary.terminalVelocity],
    ['Impact Velocity (m/s)', result.summary.impactVelocity],
    ['Fall Time (s)', result.summary.fallTime],
    ['Impact Energy (J)', result.summary.impactEnergy],
    ['Destruction Level', result.summary.destructionLevel],
    ['Destruction Ratio', result.summary.destructionRatio],
    ['Drift (m)', result.summary.drift],
  ] : [];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'Trajectory');

  if (summaryData.length) {
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
  }

  if (result.settings) {
    const settingsData = Object.entries(result.settings)
      .filter(([, v]) => typeof v !== 'object')
      .map(([k, v]) => [k, v]);
    const ws3 = XLSX.utils.aoa_to_sheet([['Parameter', 'Value'], ...settingsData]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Parameters');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, filename || `result-${result.id}.xlsx`);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
