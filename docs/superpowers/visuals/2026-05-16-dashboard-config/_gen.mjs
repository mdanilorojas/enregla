// Generador de 20 dashboards. Cada uno = HEADER + STATS_BLOCK_N + INVOICE + SEDES.
// Ejecutar:  node _gen.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'dashboards');
mkdirSync(OUT, { recursive: true });

const HEADER = `
<div style="margin-bottom: var(--ds-space-400);">
  <div style="display:flex; align-items:flex-end; justify-content:space-between; gap: var(--ds-space-300);">
    <div>
      <h1 style="font-size: var(--ds-font-size-500); font-weight:700; color: var(--ds-text);">Mariscos El Capitán</h1>
      <p style="font-size: var(--ds-font-size-100); color: var(--ds-text-subtle); margin-top:4px;">
        42 de 60 permisos vigentes · 3 sedes · Riesgo operativo
        <span class="badge badge-alto" style="margin-left:6px;">Alto</span>
      </p>
    </div>
    <div style="display:flex; gap: var(--ds-space-100);">
      <button class="btn btn-secondary">Exportar reporte</button>
      <button class="btn btn-primary">+ Nuevo permiso</button>
    </div>
  </div>
</div>`;

const INVOICE = `
<div class="invoice-card">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <div class="invoice-title"><div class="icon">$</div>Lo que te falta pagar</div>
    <div class="approx-chip">aprox.</div>
  </div>
  <div>
    <div class="receipt-line"><div>Permiso de Bomberos<span class="more">Sede Centro</span></div><div class="price">$45 – $90</div></div>
    <div class="receipt-line"><div>Patente Municipal<span class="more">Sede Norte</span></div><div class="price">$120 – $300</div></div>
    <div class="receipt-line"><div>Salud · ARCSA<span class="more">Sede Centro</span></div><div class="price">$85 – $140</div></div>
    <div class="receipt-line"><div>Uso de Suelo<span class="more">Sede Sur</span></div><div class="price">$60 – $120</div></div>
    <div class="receipt-line"><div>+ 14 trámites más</div><div class="price">$230 – $530</div></div>
  </div>
  <div class="receipt-total">
    <div class="label">Total pendiente</div>
    <div class="amount"><span>$540 – $1 180</span><small>USD</small></div>
  </div>
  <div class="warning-box">Si no actuás, multas potenciales por <b>$3 420 – $12 800</b>.</div>
  <div class="footnote">Valores aproximados según ARCSA, GAD y Bomberos.</div>
</div>`;

const SEDES = `
<div style="margin-bottom: var(--ds-space-300);">
  <h2 style="font-size: var(--ds-font-size-300); font-weight:600; color: var(--ds-text); margin-bottom: var(--ds-space-150);">Sedes</h2>
  <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: var(--ds-space-200);">
    ${sedeCard('Sede Centro','Av. 9 de Octubre 1234','alto','Alto', [['Vigentes','5/8','vigente'],['P. vencer','1','por-vencer'],['Vencidos','2','vencido']], [['vigente',62],['por-vencer',13],['vencido',25]])}
    ${sedeCard('Sede Norte','Vía Daule km 6','medio','Medio', [['Vigentes','6/8','vigente'],['P. vencer','1','por-vencer'],['En trámite','1','en-tramite']], [['vigente',75],['por-vencer',13],['en-tramite',12]])}
    ${sedeCard('Sede Sur','Sauces 9','critico','Crítico', [['Vigentes','4/8','vigente'],['Vencidos','2','vencido'],['Sin doc','2','no-registrado']], [['vigente',50],['vencido',25],['no-registrado',25]])}
  </div>
</div>`;

function sedeCard(name, addr, riskKey, riskLabel, kpis, bars) {
  const kpiHtml = kpis.map(([l,v,c]) => `<div><div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.05em;">${l}</div><div style="font-weight:600; color: var(--ds-status-${c}-text);">${v}</div></div>`).join('');
  const barHtml = bars.map(([c,w]) => `<div style="background: var(--ds-status-${c}); width:${w}%;"></div>`).join('');
  return `<div class="card" style="padding: var(--ds-space-300);">
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: var(--ds-space-150);">
      <div><div style="font-size: var(--ds-font-size-200); font-weight:600;">${name}</div><div class="muted" style="font-size: var(--ds-font-size-075); margin-top:2px;">${addr}</div></div>
      <span class="badge badge-${riskKey}">${riskLabel}</span>
    </div>
    <div style="display:flex; gap: var(--ds-space-100); margin-top: var(--ds-space-200); justify-content:space-between;">${kpiHtml}</div>
    <div style="height:6px; background: var(--ds-neutral-100); border-radius:3px; overflow:hidden; display:flex; margin-top: var(--ds-space-150);">${barHtml}</div>
  </div>`;
}

// Helper: stat row wrapper. statsHtml = el bloque creativo izquierdo. Layout: stats | invoice (1.6fr).
function statsRow(statsHtml) {
  return `<div style="display:grid; grid-template-columns: 1fr 380px; gap: var(--ds-space-300); margin-bottom: var(--ds-space-400); align-items:start;">
    <div>${statsHtml}</div>
    ${INVOICE}
  </div>`;
}

// Page wrapper
function page(title, statsBlock) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><title>${title}</title>
<link rel="stylesheet" href="../_ds.css"/></head>
<body>
<div class="mock-page"><div class="container">
${HEADER}
${statsRow(statsBlock)}
${SEDES}
</div></div>
</body></html>`;
}

// ============================================
// 20 STATS BLOCKS — solo cambia esta seccion
// Spectrum: 01-05 conservador · 06-12 refinado · 13-20 explorador
// ============================================

const stats = {};

// D01 · 4 KPI tiles clásicos
stats[1] = `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: var(--ds-space-200);">
  ${kpiTile('Vigentes', 42, 'de 60 totales', 'vigente')}
  ${kpiTile('Por vencer', 8, 'en 30 días', 'por-vencer')}
  ${kpiTile('Vencidos', 4, 'acción inmediata', 'vencido')}
  ${kpiTile('No registrados', 6, 'sin documento', 'no-registrado')}
</div>`;

function kpiTile(label, value, sub, statusClass) {
  return `<div class="card" style="padding: var(--ds-space-250);">
    <div style="font-size: var(--ds-font-size-075); text-transform:uppercase; letter-spacing:0.05em; color: var(--ds-text-subtle); font-weight:600;">${label}</div>
    <div style="font-size: var(--ds-font-size-500); font-weight:700; color: var(--ds-status-${statusClass}-text); margin-top:6px; font-variant-numeric:tabular-nums;">${value}</div>
    <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtlest); margin-top:2px;">${sub}</div>
  </div>`;
}

// D02 · 4 KPI con delta semanal
stats[2] = `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: var(--ds-space-200);">
  ${kpiDelta('Vigentes', 42, '+3', 'up', 'vigente')}
  ${kpiDelta('Por vencer', 8, '+2', 'down', 'por-vencer')}
  ${kpiDelta('Vencidos', 4, '+1', 'down', 'vencido')}
  ${kpiDelta('No registrados', 6, '0', 'flat', 'no-registrado')}
</div>`;

function kpiDelta(label, value, delta, dir, statusClass) {
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↑' : '—';
  const deltaColor = dir === 'up' ? 'var(--ds-status-vigente-text)' : dir === 'down' ? 'var(--ds-status-vencido-text)' : 'var(--ds-text-subtle)';
  return `<div class="card" style="padding: var(--ds-space-250);">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div style="font-size: var(--ds-font-size-075); text-transform:uppercase; letter-spacing:0.05em; color: var(--ds-text-subtle); font-weight:600;">${label}</div>
      <span style="font-size:11px; color:${deltaColor}; font-weight:600; font-variant-numeric:tabular-nums;">${arrow} ${delta}</span>
    </div>
    <div style="font-size: var(--ds-font-size-500); font-weight:700; color: var(--ds-status-${statusClass}-text); margin-top:6px; font-variant-numeric:tabular-nums;">${value}</div>
    <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtlest); margin-top:2px;">vs semana anterior</div>
  </div>`;
}

// D03 · gauge radial grande + 3 mini KPIs
stats[3] = `<div style="display:grid; grid-template-columns: 220px 1fr; gap: var(--ds-space-200); align-items:stretch;">
  <div class="card" style="padding: var(--ds-space-250); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
    <svg viewBox="0 0 100 100" style="width:160px; height:160px; transform:rotate(-90deg);">
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ds-neutral-100)" stroke-width="10"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ds-status-vigente)" stroke-width="10" stroke-dasharray="263.9" stroke-dashoffset="79.2" stroke-linecap="round"/>
    </svg>
    <div style="margin-top:-110px; font-size: var(--ds-font-size-500); font-weight:700; color: var(--ds-text); line-height:1;">70<span style="font-size:18px; opacity:0.6;">%</span></div>
    <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle); margin-top:88px;">cumplimiento</div>
  </div>
  <div style="display:flex; flex-direction:column; gap: var(--ds-space-150);">
    ${kpiRow('Por vencer', 8, 'En próximos 30 días', 'por-vencer')}
    ${kpiRow('Vencidos', 4, 'Requieren renovación', 'vencido')}
    ${kpiRow('No registrados', 6, 'Sin documento adjunto', 'no-registrado')}
  </div>
</div>`;

function kpiRow(label, value, sub, statusClass) {
  return `<div class="card" style="padding: var(--ds-space-200); display:flex; align-items:center; gap: var(--ds-space-200);">
    <div style="font-size: var(--ds-font-size-400); font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums; min-width:50px;">${value}</div>
    <div>
      <div style="font-size: var(--ds-font-size-100); font-weight:600;">${label}</div>
      <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle);">${sub}</div>
    </div>
  </div>`;
}

// D04 · KPI horizontal stacked bar grande
stats[4] = `<div class="card" style="padding: var(--ds-space-300);">
  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom: var(--ds-space-200);">
    <div>
      <div style="font-size: var(--ds-font-size-100); color: var(--ds-text-subtle); font-weight:500;">Distribución de permisos</div>
      <div style="font-size: var(--ds-font-size-600); font-weight:700; color: var(--ds-text); line-height:1; margin-top:4px; font-variant-numeric:tabular-nums;">60</div>
    </div>
    <span class="badge badge-bajo">+5 vs mes</span>
  </div>
  <div style="display:flex; height:14px; border-radius: var(--ds-radius-200); overflow:hidden; gap:2px;">
    <div style="background: var(--ds-status-vigente); flex:42; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:700;">42</div>
    <div style="background: var(--ds-status-por-vencer); flex:8;"></div>
    <div style="background: var(--ds-status-vencido); flex:4;"></div>
    <div style="background: var(--ds-status-no-registrado); flex:6;"></div>
  </div>
  <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-150); margin-top: var(--ds-space-200);">
    ${legendRow('Vigentes', 42, 'vigente')}
    ${legendRow('Por vencer', 8, 'por-vencer')}
    ${legendRow('Vencidos', 4, 'vencido')}
    ${legendRow('No registrados', 6, 'no-registrado')}
  </div>
</div>`;

function legendRow(label, value, statusClass) {
  return `<div style="display:flex; align-items:center; gap: var(--ds-space-100);">
    <span style="width:10px; height:10px; background: var(--ds-status-${statusClass}); border-radius: var(--ds-radius-050);"></span>
    <div>
      <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">${label}</div>
      <div style="font-size: var(--ds-font-size-300); font-weight:700; color: var(--ds-text); font-variant-numeric:tabular-nums;">${value}</div>
    </div>
  </div>`;
}

// D05 · KPI con sparklines
stats[5] = `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: var(--ds-space-200);">
  ${kpiSpark('Vigentes', 42, 'vigente', 'M0,18 L10,15 L20,17 L30,12 L40,14 L50,10 L60,11 L70,8 L80,9 L90,5 L100,4')}
  ${kpiSpark('Por vencer', 8, 'por-vencer', 'M0,12 L10,11 L20,14 L30,13 L40,15 L50,12 L60,16 L70,14 L80,17 L90,15 L100,18')}
  ${kpiSpark('Vencidos', 4, 'vencido', 'M0,20 L10,18 L20,17 L30,16 L40,14 L50,12 L60,9 L70,8 L80,7 L90,5 L100,3')}
  ${kpiSpark('No registrados', 6, 'no-registrado', 'M0,12 L10,12 L20,11 L30,11 L40,12 L50,12 L60,12 L70,11 L80,12 L90,12 L100,12')}
</div>`;

function kpiSpark(label, value, statusClass, path) {
  return `<div class="card" style="padding: var(--ds-space-250);">
    <div style="font-size: var(--ds-font-size-075); text-transform:uppercase; letter-spacing:0.05em; color: var(--ds-text-subtle); font-weight:600;">${label}</div>
    <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:6px; gap: var(--ds-space-150);">
      <div style="font-size: var(--ds-font-size-500); font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums; line-height:1;">${value}</div>
      <svg viewBox="0 0 100 22" style="width:80px; height:22px;"><path d="${path}" fill="none" stroke="var(--ds-status-${statusClass})" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
  </div>`;
}

// D06 · Hero gauge gigante 240px (refinado, hero-céntrico)
stats[6] = `<div class="card" style="padding: var(--ds-space-300); display:grid; grid-template-columns: 260px 1fr; gap: var(--ds-space-300); align-items:center;">
  <div style="position:relative; width:240px; height:240px;">
    <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ds-neutral-100)" stroke-width="6"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ds-status-vigente)" stroke-width="6" stroke-dasharray="263.9" stroke-dashoffset="79.2" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="var(--ds-neutral-100)" stroke-width="2"/>
    </svg>
    <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.1em; font-weight:600;">Cumplimiento</div>
      <div style="font-size:64px; font-weight:300; color: var(--ds-text); line-height:1; letter-spacing:-0.04em; font-variant-numeric:tabular-nums; margin-top:4px;">70<span style="font-size:24px; opacity:0.6;">%</span></div>
      <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle); margin-top:6px;">42 / 60 vigentes</div>
    </div>
  </div>
  <div style="display:grid; grid-template-rows: repeat(4, 1fr); gap: var(--ds-space-100);">
    ${miniBar('Vigentes', 42, 70, 'vigente')}
    ${miniBar('Por vencer', 8, 13, 'por-vencer')}
    ${miniBar('Vencidos', 4, 7, 'vencido')}
    ${miniBar('No registrados', 6, 10, 'no-registrado')}
  </div>
</div>`;

function miniBar(label, value, pct, statusClass) {
  return `<div>
    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
      <span style="color: var(--ds-text-subtle); font-weight:500;">${label}</span>
      <span style="font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums;">${value}</span>
    </div>
    <div style="height:6px; background: var(--ds-neutral-100); border-radius: var(--ds-radius-100); overflow:hidden;">
      <div style="background: var(--ds-status-${statusClass}); width:${pct}%; height:100%;"></div>
    </div>
  </div>`;
}

// D07 · Editorial — 4 columnas con border duro periódico
stats[7] = `<div class="card" style="padding:0; overflow:hidden;">
  <div style="display:grid; grid-template-columns: repeat(4, 1fr); border-top:3px solid var(--ds-text);">
    ${editorialCol('Vigentes', 42, 'de 60 totales', 'vigente', false)}
    ${editorialCol('Por vencer', 8, 'en 30 días', 'por-vencer', true)}
    ${editorialCol('Vencidos', 4, 'acción inmediata', 'vencido', true)}
    ${editorialCol('No registrados', 6, 'sin documento', 'no-registrado', true)}
  </div>
</div>`;

function editorialCol(label, value, sub, statusClass, leftBorder) {
  return `<div style="padding: var(--ds-space-300); ${leftBorder ? 'border-left:1px solid var(--ds-border);' : ''}">
    <div style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color: var(--ds-text-subtle); font-weight:700;">${label}</div>
    <div style="font-size:54px; font-weight:300; color: var(--ds-status-${statusClass}-text); line-height:1; letter-spacing:-0.04em; margin-top: var(--ds-space-200); font-variant-numeric:tabular-nums;">${value}</div>
    <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle); font-style:italic; margin-top:6px;">${sub}</div>
  </div>`;
}

// D08 · cinemático — gauge fondo + 4 KPIs flotando
stats[8] = `<div class="card" style="padding: var(--ds-space-300); position:relative; overflow:hidden; min-height: 280px;">
  <svg viewBox="0 0 200 200" style="position:absolute; right:-40px; top:-40px; width:280px; height:280px; opacity:0.12; pointer-events:none;">
    <circle cx="100" cy="100" r="80" fill="none" stroke="var(--ds-blue-500)" stroke-width="40"/>
    <circle cx="100" cy="100" r="80" fill="none" stroke="var(--ds-status-vigente)" stroke-width="40" stroke-dasharray="502" stroke-dashoffset="150" transform="rotate(-90 100 100)"/>
  </svg>
  <div style="position:relative; z-index:1;">
    <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.1em; font-weight:700;">Estado de cumplimiento</div>
    <div style="font-size:72px; font-weight:200; color: var(--ds-text); line-height:1; letter-spacing:-0.04em; margin-top:8px; font-variant-numeric:tabular-nums;">
      70<span style="font-size:32px; color: var(--ds-text-subtle); font-weight:300;">%</span>
    </div>
    <div style="font-size: var(--ds-font-size-100); color: var(--ds-text-subtle); margin-top:4px;">42 de 60 permisos en regla</div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-150); margin-top: var(--ds-space-300);">
      ${miniChip(42, 'Vigentes', 'vigente')}
      ${miniChip(8, 'Por vencer', 'por-vencer')}
      ${miniChip(4, 'Vencidos', 'vencido')}
      ${miniChip(6, 'Sin doc', 'no-registrado')}
    </div>
  </div>
</div>`;

function miniChip(value, label, statusClass) {
  return `<div style="background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); border:1px solid var(--ds-border); border-radius: var(--ds-radius-200); padding: var(--ds-space-150);">
    <div style="font-size: var(--ds-font-size-300); font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums; line-height:1;">${value}</div>
    <div style="font-size:11px; color: var(--ds-text-subtle); margin-top:4px; text-transform:uppercase; letter-spacing:0.05em;">${label}</div>
  </div>`;
}

// D09 · doble-anillo (refinado pro)
stats[9] = `<div class="card" style="padding: var(--ds-space-300); display:grid; grid-template-columns: 240px 1fr; gap: var(--ds-space-300); align-items:center;">
  <div style="position:relative; width:220px; height:220px;">
    <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ds-neutral-100)" stroke-width="6"/>
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ds-status-vigente)" stroke-width="6" stroke-dasharray="276.5" stroke-dashoffset="83" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="var(--ds-neutral-100)" stroke-width="6"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="var(--ds-status-por-vencer)" stroke-width="6" stroke-dasharray="213.6" stroke-dashoffset="186" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="var(--ds-neutral-100)" stroke-width="6"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="var(--ds-status-vencido)" stroke-width="6" stroke-dasharray="150.8" stroke-dashoffset="140" stroke-linecap="round"/>
    </svg>
    <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <div style="font-size:48px; font-weight:300; color: var(--ds-text); line-height:1; font-variant-numeric:tabular-nums;">70<span style="font-size:18px;">%</span></div>
      <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">cumplimiento</div>
    </div>
  </div>
  <div>
    <div style="font-size: var(--ds-font-size-100); color: var(--ds-text-subtle); font-weight:500; margin-bottom: var(--ds-space-150);">Anillos por urgencia</div>
    ${ringLegend('Externo · Vigentes', 42, '70%', 'vigente')}
    ${ringLegend('Medio · Por vencer', 8, '13%', 'por-vencer')}
    ${ringLegend('Interno · Vencidos', 4, '7%', 'vencido')}
    <div style="margin-top: var(--ds-space-200); font-size: var(--ds-font-size-075); color: var(--ds-text-subtle); font-style:italic;">No registrados (6) no se muestran en el gráfico — aparecen en sedes.</div>
  </div>
</div>`;

function ringLegend(label, value, pct, statusClass) {
  return `<div style="display:grid; grid-template-columns: 12px 1fr auto auto; gap: var(--ds-space-100); align-items:center; padding: var(--ds-space-100) 0; border-bottom:1px dotted var(--ds-border);">
    <span style="width:10px; height:10px; border-radius:50%; background: var(--ds-status-${statusClass});"></span>
    <span style="font-size: var(--ds-font-size-100); color: var(--ds-text);">${label}</span>
    <span style="font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums;">${value}</span>
    <span style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle); font-variant-numeric:tabular-nums;">${pct}</span>
  </div>`;
}

// D10 · headline tipográfico grande + 4 KPI debajo
stats[10] = `<div class="card" style="padding: var(--ds-space-400);">
  <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.18em; font-weight:700;">Resumen general</div>
  <h2 style="font-size:48px; font-weight:300; line-height:1.1; letter-spacing:-0.02em; color: var(--ds-text); margin-top: var(--ds-space-150); margin-bottom: var(--ds-space-300); max-width:520px;">
    <span style="color: var(--ds-status-vigente-text); font-weight:600;">42 de 60</span> permisos vigentes,<br/>
    <span style="color: var(--ds-status-vencido-text); font-weight:600;">4 vencidos</span> requieren acción inmediata.
  </h2>
  <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-200); padding-top: var(--ds-space-200); border-top:1px solid var(--ds-border);">
    ${editorialMiniCol('Vigentes', 42, 'vigente')}
    ${editorialMiniCol('Por vencer', 8, 'por-vencer')}
    ${editorialMiniCol('Vencidos', 4, 'vencido')}
    ${editorialMiniCol('No reg.', 6, 'no-registrado')}
  </div>
</div>`;

function editorialMiniCol(label, value, statusClass) {
  return `<div>
    <div style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color: var(--ds-text-subtle); font-weight:600;">${label}</div>
    <div style="font-size: var(--ds-font-size-500); font-weight:300; color: var(--ds-status-${statusClass}-text); line-height:1; letter-spacing:-0.03em; margin-top:4px; font-variant-numeric:tabular-nums;">${value}</div>
  </div>`;
}

// D11 · Numeric Brutalist — números enormes
stats[11] = `<div style="display:grid; grid-template-columns: 2fr 1fr; gap: var(--ds-space-200);">
  <div class="card" style="padding: var(--ds-space-400); display:flex; flex-direction:column; justify-content:space-between;">
    <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.15em; font-weight:700;">Vigentes</div>
    <div style="display:flex; align-items:baseline; gap: var(--ds-space-200); margin-top: var(--ds-space-150);">
      <div style="font-size:120px; font-weight:800; color: var(--ds-status-vigente-text); line-height:0.9; letter-spacing:-0.06em; font-variant-numeric:tabular-nums;">42</div>
      <div style="font-size: var(--ds-font-size-300); color: var(--ds-text-subtle); font-weight:300;">/ 60</div>
    </div>
    <div style="font-size: var(--ds-font-size-100); color: var(--ds-text-subtle); margin-top: var(--ds-space-200);">Mariscos El Capitán está al 70% de cumplimiento normativo. <strong style="color: var(--ds-text);">Quedan 18</strong> trámites por resolver.</div>
  </div>
  <div style="display:grid; grid-template-rows: repeat(3, 1fr); gap: var(--ds-space-100);">
    ${kpiBrutalSmall('Por vencer', 8, 'por-vencer')}
    ${kpiBrutalSmall('Vencidos', 4, 'vencido')}
    ${kpiBrutalSmall('Sin doc', 6, 'no-registrado')}
  </div>
</div>`;

function kpiBrutalSmall(label, value, statusClass) {
  return `<div class="card" style="padding: var(--ds-space-200); display:flex; align-items:baseline; gap: var(--ds-space-150);">
    <div style="font-size:36px; font-weight:800; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums; line-height:0.9; letter-spacing:-0.04em;">${value}</div>
    <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.1em; font-weight:700;">${label}</div>
  </div>`;
}

// D12 · 4 mini-gauges en grid
stats[12] = `<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-150);">
  ${miniGauge('Vigentes', 42, 60, 70, 'vigente')}
  ${miniGauge('Por vencer', 8, 18, 44, 'por-vencer')}
  ${miniGauge('Vencidos', 4, 18, 22, 'vencido')}
  ${miniGauge('Sin doc', 6, 18, 33, 'no-registrado')}
</div>`;

function miniGauge(label, value, total, pct, statusClass) {
  const dasharray = 119.4; // r=19
  const offset = dasharray * (1 - pct/100);
  return `<div class="card" style="padding: var(--ds-space-200); text-align:center;">
    <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">${label}</div>
    <div style="position:relative; width:100px; height:100px; margin: 8px auto;">
      <svg viewBox="0 0 50 50" style="width:100%; height:100%; transform:rotate(-90deg);">
        <circle cx="25" cy="25" r="19" fill="none" stroke="var(--ds-neutral-100)" stroke-width="4"/>
        <circle cx="25" cy="25" r="19" fill="none" stroke="var(--ds-status-${statusClass})" stroke-width="4" stroke-dasharray="${dasharray}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
      </svg>
      <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div style="font-size: var(--ds-font-size-300); font-weight:700; color: var(--ds-status-${statusClass}-text); line-height:1; font-variant-numeric:tabular-nums;">${value}</div>
        <div style="font-size:10px; color: var(--ds-text-subtle);">de ${total}</div>
      </div>
    </div>
  </div>`;
}

// D13 · Resumen ejecutivo (hero card oscuro brand)
stats[13] = `<div class="card" style="padding: var(--ds-space-400); background: linear-gradient(135deg, var(--ds-blue-500), var(--ds-blue-700)); color: white; border:0; box-shadow: var(--ds-shadow-overlay);">
  <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: var(--ds-space-300);">
    <div>
      <div style="font-size:11px; opacity:0.7; text-transform:uppercase; letter-spacing:0.15em; font-weight:700;">Resumen ejecutivo · 16 mayo 2026</div>
      <h2 style="font-size:42px; font-weight:300; line-height:1.1; letter-spacing:-0.02em; margin-top:8px;">
        <span style="font-weight:600; color: var(--ds-orange-300);">70%</span> de cumplimiento general
      </h2>
      <p style="font-size: var(--ds-font-size-200); opacity:0.9; max-width: 480px; margin-top: var(--ds-space-150); line-height:1.5;">
        18 permisos pendientes representan riesgo financiero y operativo. La sede más afectada es <strong>Sede Sur</strong>.
      </p>
    </div>
    <div style="text-align:right; min-width: 160px;">
      <div style="font-size:11px; opacity:0.7; text-transform:uppercase; letter-spacing:0.1em;">Total</div>
      <div style="font-size: var(--ds-font-size-600); font-weight:700; line-height:1; font-variant-numeric:tabular-nums; margin-top:4px;">60</div>
      <div style="font-size: var(--ds-font-size-075); opacity:0.7; margin-top:2px;">permisos requeridos</div>
    </div>
  </div>
  <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-200); margin-top: var(--ds-space-300); padding-top: var(--ds-space-300); border-top:1px solid rgba(255,255,255,0.15);">
    ${execMini('Vigentes', 42, '#36B37E')}
    ${execMini('Por vencer', 8, '#FF991F')}
    ${execMini('Vencidos', 4, '#DE350B')}
    ${execMini('Sin doc', 6, '#B3B9C4')}
  </div>
</div>`;

function execMini(label, value, color) {
  return `<div>
    <div style="font-size:10px; opacity:0.7; text-transform:uppercase; letter-spacing:0.1em; font-weight:600;">${label}</div>
    <div style="display:flex; align-items:baseline; gap:6px; margin-top:4px;">
      <span style="width:8px; height:8px; background:${color}; border-radius:50%; flex-shrink:0;"></span>
      <span style="font-size: var(--ds-font-size-400); font-weight:700; font-variant-numeric:tabular-nums; line-height:1;">${value}</span>
    </div>
  </div>`;
}

// D14 · Trust ledger — registro con regletas
stats[14] = `<div class="card" style="padding: var(--ds-space-300);">
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding-bottom: var(--ds-space-200); border-bottom: 2px solid var(--ds-text);">
    <div style="font-size: var(--ds-font-size-100); color: var(--ds-text); font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Registro de cumplimiento</div>
    <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle); font-style:italic;">cierre · 16 may 2026</div>
  </div>
  ${ledgerLine('Vigentes', 42, 60, 'vigente')}
  ${ledgerLine('Por vencer (≤30d)', 8, 60, 'por-vencer')}
  ${ledgerLine('Vencidos', 4, 60, 'vencido')}
  ${ledgerLine('No registrados', 6, 60, 'no-registrado')}
  <div style="display:flex; justify-content:space-between; padding-top: var(--ds-space-200); margin-top: var(--ds-space-100); border-top:2px solid var(--ds-text);">
    <div style="font-weight:700; font-size: var(--ds-font-size-100);">TOTAL</div>
    <div style="font-weight:700; font-size: var(--ds-font-size-100); font-variant-numeric:tabular-nums;">60 / 60</div>
  </div>
</div>`;

function ledgerLine(label, value, total, statusClass) {
  const pct = (value/total*100).toFixed(1);
  const w = (value/total*100);
  return `<div style="display:grid; grid-template-columns: 200px 1fr auto auto; gap: var(--ds-space-200); align-items:center; padding: var(--ds-space-150) 0; border-bottom: 1px dotted var(--ds-border);">
    <div style="font-size: var(--ds-font-size-100); font-weight:500;">${label}</div>
    <div style="height:8px; background: var(--ds-neutral-100); border-radius: var(--ds-radius-100); overflow:hidden;"><div style="background: var(--ds-status-${statusClass}); width:${w}%; height:100%;"></div></div>
    <div style="font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums; min-width:30px; text-align:right;">${value}</div>
    <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle); font-variant-numeric:tabular-nums; min-width:48px; text-align:right;">${pct}%</div>
  </div>`;
}

// D15 · money-first (hero monetario)
stats[15] = `<div class="card" style="padding: var(--ds-space-400); background: linear-gradient(135deg, var(--ds-orange-50), var(--ds-orange-100)); border:1px solid var(--ds-orange-200);">
  <div style="font-size:11px; color: var(--ds-orange-800); text-transform:uppercase; letter-spacing:0.15em; font-weight:700;">Exposición monetaria</div>
  <div style="display:flex; align-items:baseline; gap: var(--ds-space-200); margin-top: var(--ds-space-200);">
    <div style="font-size:64px; font-weight:700; color: var(--ds-red-600); line-height:0.9; letter-spacing:-0.03em; font-variant-numeric:tabular-nums;">$12 800</div>
    <div style="font-size: var(--ds-font-size-200); color: var(--ds-orange-800); font-weight:500;">en multas potenciales</div>
  </div>
  <div style="font-size: var(--ds-font-size-100); color: var(--ds-text); margin-top: var(--ds-space-100); line-height:1.5;">
    Si no resolvés tus 18 permisos pendientes en los próximos 30 días.
    El costo de regularizar es <strong style="color: var(--ds-blue-600);">$540 – $1 180</strong> en trámites.
  </div>
  <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-150); margin-top: var(--ds-space-300); padding-top: var(--ds-space-200); border-top:1px solid var(--ds-orange-200);">
    ${kpiOnOrange('42', 'Vigentes', '#218c3b')}
    ${kpiOnOrange('8', 'Por vencer', '#f44336')}
    ${kpiOnOrange('4', 'Vencidos', '#BF2600')}
    ${kpiOnOrange('6', 'Sin doc', '#626F86')}
  </div>
</div>`;

function kpiOnOrange(value, label, color) {
  return `<div>
    <div style="font-size: var(--ds-font-size-400); font-weight:700; color:${color}; line-height:1; font-variant-numeric:tabular-nums;">${value}</div>
    <div style="font-size:11px; color: var(--ds-orange-800); margin-top:4px; text-transform:uppercase; letter-spacing:0.05em;">${label}</div>
  </div>`;
}

// D16 · Risk-first — gauge gigante centrado
stats[16] = `<div class="card" style="padding: var(--ds-space-400); display:flex; flex-direction:column; align-items:center; text-align:center;">
  <div style="position:relative; width:320px; height:200px;">
    <svg viewBox="0 0 200 110" style="width:100%; height:100%;">
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--ds-neutral-100)" stroke-width="20"/>
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" stroke-width="20" stroke-dasharray="251.3" stroke-dashoffset="75.4" stroke-linecap="round"/>
      <defs><linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--ds-red-500)"/>
        <stop offset="50%" stop-color="var(--ds-yellow-500)"/>
        <stop offset="100%" stop-color="var(--ds-green-500)"/>
      </linearGradient></defs>
      <line x1="100" y1="100" x2="${100 + 70 * Math.cos(-Math.PI + Math.PI*0.7)}" y2="${100 + 70 * Math.sin(-Math.PI + Math.PI*0.7)}" stroke="var(--ds-text)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="6" fill="var(--ds-text)"/>
    </svg>
    <div style="position:absolute; inset:auto 0 -10px 0; text-align:center;">
      <div style="font-size:64px; font-weight:300; color: var(--ds-text); line-height:1; letter-spacing:-0.04em; font-variant-numeric:tabular-nums;">70<span style="font-size:24px; opacity:0.6;">%</span></div>
    </div>
  </div>
  <div style="font-size: var(--ds-font-size-100); color: var(--ds-text-subtle); margin-top: var(--ds-space-300);">Riesgo operativo <span class="badge badge-alto" style="margin-left:6px;">Alto</span></div>
  <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-200); margin-top: var(--ds-space-300); width:100%; padding-top: var(--ds-space-200); border-top:1px solid var(--ds-border);">
    ${editorialMiniCol('Vigentes', 42, 'vigente')}
    ${editorialMiniCol('Por vencer', 8, 'por-vencer')}
    ${editorialMiniCol('Vencidos', 4, 'vencido')}
    ${editorialMiniCol('Sin doc', 6, 'no-registrado')}
  </div>
</div>`;

// D17 · Explorador 1 — kpi con micro-charts
stats[17] = `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: var(--ds-space-200);">
  ${kpiMicroBars('Vigentes', 42, 'vigente', [3,5,4,7,5,6,8,9,7,8,9,10,11,12,13,14,42])}
  ${kpiMicroBars('Por vencer', 8, 'por-vencer', [2,3,2,4,3,5,4,3,5,6,4,5,6,5,7,6,8])}
  ${kpiMicroBars('Vencidos', 4, 'vencido', [0,0,1,1,0,1,2,2,1,2,3,2,3,3,4,3,4])}
  ${kpiMicroBars('Sin doc', 6, 'no-registrado', [4,5,4,6,5,5,6,7,6,5,6,7,6,7,6,7,6])}
</div>`;

function kpiMicroBars(label, value, statusClass, data) {
  const max = Math.max(...data);
  const bars = data.map((d,i) => `<rect x="${i*5+1}" y="${30 - (d/max*28)}" width="3" height="${d/max*28}" fill="var(--ds-status-${statusClass})" opacity="${0.3 + (i/data.length)*0.7}"/>`).join('');
  return `<div class="card" style="padding: var(--ds-space-250);">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color: var(--ds-text-subtle); font-weight:600;">${label}</div>
      <span class="badge badge-${statusClass==='vigente'?'bajo':statusClass==='por-vencer'?'medio':statusClass==='vencido'?'alto':'medio'}" style="font-size:10px;">${data.length}sem</span>
    </div>
    <div style="display:flex; align-items:flex-end; gap: var(--ds-space-150); margin-top: var(--ds-space-100);">
      <div style="font-size: var(--ds-font-size-500); font-weight:700; color: var(--ds-status-${statusClass}-text); line-height:1; font-variant-numeric:tabular-nums;">${value}</div>
      <svg viewBox="0 0 90 32" style="width:90px; height:32px; flex-shrink:0;">${bars}</svg>
    </div>
  </div>`;
}

// D18 · timeline integrada (calendario horizontal)
stats[18] = `<div class="card" style="padding: var(--ds-space-300);">
  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom: var(--ds-space-200);">
    <div>
      <div style="font-size: var(--ds-font-size-100); font-weight:600;">Próximos 90 días</div>
      <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle);">vencimientos por mes</div>
    </div>
    <div style="display:flex; gap: var(--ds-space-100);">
      <span class="badge badge-vencido">2 vencidos</span>
      <span class="badge badge-por-vencer">8 próx.</span>
    </div>
  </div>
  <!-- timeline -->
  <div style="position:relative; padding: var(--ds-space-200) 0; margin-bottom: var(--ds-space-200);">
    <div style="position:absolute; left:0; right:0; top:50%; height:2px; background: var(--ds-border); transform:translateY(-50%);"></div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); position:relative; gap: var(--ds-space-100);">
      ${timelineMonth('MAY', 2, 'vencido')}
      ${timelineMonth('JUN', 5, 'por-vencer')}
      ${timelineMonth('JUL', 3, 'por-vencer')}
      ${timelineMonth('AGO', 0, 'vigente')}
    </div>
  </div>
  <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-150); padding-top: var(--ds-space-200); border-top:1px solid var(--ds-border);">
    ${editorialMiniCol('Vigentes', 42, 'vigente')}
    ${editorialMiniCol('Por vencer', 8, 'por-vencer')}
    ${editorialMiniCol('Vencidos', 4, 'vencido')}
    ${editorialMiniCol('Sin doc', 6, 'no-registrado')}
  </div>
</div>`;

function timelineMonth(name, count, statusClass) {
  return `<div style="text-align:center; position:relative;">
    <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">${name}</div>
    <div style="margin: var(--ds-space-150) auto 0; width:18px; height:18px; background: var(--ds-status-${statusClass}); border:3px solid white; border-radius:50%; box-shadow: 0 0 0 2px var(--ds-status-${statusClass});"></div>
    <div style="margin-top:6px; font-size: var(--ds-font-size-300); font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums; line-height:1;">${count || '—'}</div>
    <div style="font-size:10px; color: var(--ds-text-subtle); margin-top:2px;">${count===0?'sin venc.':count===1?'venc.':'vencs.'}</div>
  </div>`;
}

// D19 · gauge 3D-ish (segmented + glow)
stats[19] = `<div class="card" style="padding: var(--ds-space-300); display:grid; grid-template-columns: 240px 1fr; gap: var(--ds-space-300); align-items:center;">
  <div style="position:relative; width:220px; height:220px;">
    <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${segArc(0, 70, 'var(--ds-status-vigente)')}
      ${segArc(70, 13, 'var(--ds-status-por-vencer)')}
      ${segArc(83, 7, 'var(--ds-status-vencido)')}
      ${segArc(90, 10, 'var(--ds-status-no-registrado)')}
    </svg>
    <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <div style="font-size:11px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.1em; font-weight:600;">Distribución</div>
      <div style="font-size:48px; font-weight:300; color: var(--ds-text); line-height:1; margin-top:4px; letter-spacing:-0.04em; font-variant-numeric:tabular-nums;">60</div>
      <div style="font-size: var(--ds-font-size-075); color: var(--ds-text-subtle);">permisos totales</div>
    </div>
  </div>
  <div style="display:flex; flex-direction:column; gap: var(--ds-space-150);">
    ${segLegend('Vigentes', 42, 70, 'vigente')}
    ${segLegend('Por vencer', 8, 13, 'por-vencer')}
    ${segLegend('Vencidos', 4, 7, 'vencido')}
    ${segLegend('No registrados', 6, 10, 'no-registrado')}
  </div>
</div>`;

function segArc(start, span, color) {
  const r = 42, c = 2 * Math.PI * r;
  const dash = (span/100) * c - 1;
  const offset = -((start/100) * c);
  return `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-dasharray="${dash} ${c}" stroke-dashoffset="${offset}" filter="url(#glow)"/>`;
}

function segLegend(label, value, pct, statusClass) {
  return `<div style="display:flex; align-items:center; gap: var(--ds-space-150); padding: var(--ds-space-100); background: var(--ds-status-${statusClass}-bg); border-radius: var(--ds-radius-200);">
    <div style="width:12px; height:36px; background: var(--ds-status-${statusClass}); border-radius: var(--ds-radius-100);"></div>
    <div style="flex:1;">
      <div style="font-size: var(--ds-font-size-100); font-weight:600; color: var(--ds-text);">${label}</div>
      <div style="font-size:11px; color: var(--ds-text-subtle);">${pct}% del total</div>
    </div>
    <div style="font-size: var(--ds-font-size-300); font-weight:700; color: var(--ds-status-${statusClass}-text); font-variant-numeric:tabular-nums;">${value}</div>
  </div>`;
}

// D20 · weather report (cinemático maximalista)
stats[20] = `<div class="card" style="padding: var(--ds-space-400); background: linear-gradient(180deg, #fff 0%, var(--ds-blue-50) 100%); border:1px solid var(--ds-blue-200); position:relative; overflow:hidden;">
  <!-- decorative blobs -->
  <div style="position:absolute; top:-60px; right:-60px; width:200px; height:200px; background: radial-gradient(circle, var(--ds-orange-200), transparent 70%); opacity:0.5; pointer-events:none;"></div>
  <div style="position:absolute; bottom:-40px; left:-40px; width:160px; height:160px; background: radial-gradient(circle, var(--ds-blue-200), transparent 70%); opacity:0.4; pointer-events:none;"></div>
  <div style="position:relative; z-index:1;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--ds-space-200);">
      <div style="font-size:11px; color: var(--ds-blue-700); text-transform:uppercase; letter-spacing:0.18em; font-weight:700;">Pronóstico operativo</div>
      <span class="badge badge-alto">⚠ Tormenta de vencimientos</span>
    </div>
    <div style="display:grid; grid-template-columns: 1.4fr 1fr; gap: var(--ds-space-300); align-items:center;">
      <div>
        <h2 style="font-size:48px; font-weight:300; line-height:1.05; letter-spacing:-0.02em; color: var(--ds-text);">
          Día <span style="color: var(--ds-orange-700); font-weight:700;">nublado</span><br/>
          <span style="font-size: var(--ds-font-size-300); color: var(--ds-text-subtle); font-weight:400;">con probabilidad de multas</span>
        </h2>
        <p style="font-size: var(--ds-font-size-100); color: var(--ds-text); margin-top: var(--ds-space-200); line-height:1.5; max-width: 380px;">
          Tu negocio tiene <strong style="color: var(--ds-status-vencido-text);">4 permisos vencidos</strong> y <strong style="color: var(--ds-status-por-vencer-text);">8 próximos a vencer</strong>. Despejá la tormenta antes de fin de mes.
        </p>
      </div>
      <div style="text-align:center;">
        <div style="position:relative; width:180px; height:180px; margin:0 auto;">
          <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
            <circle cx="50" cy="50" r="38" fill="white" stroke="var(--ds-neutral-100)" stroke-width="8"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--ds-status-vigente)" stroke-width="8" stroke-dasharray="238.8" stroke-dashoffset="71.6" stroke-linecap="round"/>
          </svg>
          <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div style="font-size:48px; font-weight:300; color: var(--ds-text); line-height:1; letter-spacing:-0.04em; font-variant-numeric:tabular-nums;">70<span style="font-size:18px; opacity:0.6;">%</span></div>
            <div style="font-size:10px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">despejado</div>
          </div>
        </div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--ds-space-150); margin-top: var(--ds-space-300); padding-top: var(--ds-space-200); border-top:1px solid rgba(15,38,92,0.1);">
      ${weatherChip('☀','Vigentes','42','vigente')}
      ${weatherChip('🌤','Por vencer','8','por-vencer')}
      ${weatherChip('⛈','Vencidos','4','vencido')}
      ${weatherChip('🌫','Sin doc','6','no-registrado')}
    </div>
  </div>
</div>`;

function weatherChip(emoji, label, value, statusClass) {
  return `<div style="display:flex; align-items:center; gap: var(--ds-space-150); padding: var(--ds-space-150); background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); border-radius: var(--ds-radius-200); border:1px solid var(--ds-border);">
    <div style="font-size:24px; line-height:1;">${emoji}</div>
    <div>
      <div style="font-size:10px; color: var(--ds-text-subtle); text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">${label}</div>
      <div style="font-size: var(--ds-font-size-300); font-weight:700; color: var(--ds-status-${statusClass}-text); line-height:1; font-variant-numeric:tabular-nums;">${value}</div>
    </div>
  </div>`;
}

// ============================================
// Write all 20 dashboards
// ============================================
const titles = {
  1: 'D01 · Conservador clásico (4 KPI tiles)',
  2: 'D02 · Conservador con delta semanal',
  3: 'D03 · Refinado con gauge radial + KPIs',
  4: 'D04 · Refinado distribución horizontal',
  5: 'D05 · Refinado con sparklines',
  6: 'D06 · Hero gauge 240px doble anillo',
  7: 'D07 · Editorial periódico (4 columnas)',
  8: 'D08 · Cinemático con gauge fondo',
  9: 'D09 · Doble anillo refinado pro',
  10: 'D10 · Headline tipográfico + KPI mini',
  11: 'D11 · Numeric Brutalist (números enormes)',
  12: 'D12 · 4 mini-gauges grid',
  13: 'D13 · Resumen ejecutivo (hero brand oscuro)',
  14: 'D14 · Trust ledger con regletas',
  15: 'D15 · Money-first (multas hero)',
  16: 'D16 · Risk-first (gauge meteorológico)',
  17: 'D17 · KPI con histogramas semanales',
  18: 'D18 · Timeline integrada (calendario)',
  19: 'D19 · Gauge segmentado con glow',
  20: 'D20 · Weather report (cinemático maximalista)',
};

for (let i = 1; i <= 20; i++) {
  if (!stats[i]) continue;
  writeFileSync(join(OUT, `${String(i).padStart(2, '0')}.html`), page(titles[i], stats[i]));
}
console.log('OK · 20 dashboards generados.');
