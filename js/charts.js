/**
 * SVG 图表渲染工具集
 * 所有图表均使用纯 SVG 实现，无外部依赖
 */
import { REAL_SKILLS, SUB_SCENARIO_DATA, ALL_CAPABILITIES, getSkillById } from './data/skills.js';

const CHART_COLORS = ['#4F46E5', '#7C3AED', '#3B82F6', '#059669', '#D97706', '#EC4899', '#0EA5E9', '#F59E0B', '#DC2626', '#14B8A6'];

/**
 * Treemap - 场景分布图
 * 关联：全景总览 → 点击跳转场景分析
 */
export function renderTreemapSVG(containerId, onSkillClick) {
  const sorted = [...REAL_SKILLS].sort((a, b) => b.primaryCount - a.primaryCount);
  const W = 800, H = 380, GAP = 3;
  const total = sorted.reduce((a, s) => a + s.primaryCount, 0);
  const rows = [[sorted[0]], [sorted[1], sorted[2], sorted[3], sorted[4]], [sorted[5], sorted[6], sorted[7], sorted[8], sorted[9]]];
  const rowTotals = rows.map(r => r.reduce((a, s) => a + s.primaryCount, 0));
  const rowHeights = rowTotals.map(t => Math.round((t / total) * (H - GAP * 2)));
  rowHeights[2] = H - rowHeights[0] - rowHeights[1] - GAP * 2;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  let curY = 0;
  rows.forEach((row, ri) => {
    const rh = rowHeights[ri];
    let curX = 0;
    const rTotal = rowTotals[ri];
    row.forEach((s, ci) => {
      const rw = ci === row.length - 1 ? W - curX : Math.round((s.primaryCount / rTotal) * (W - GAP * (row.length - 1)));
      const x = curX, y = curY;
      svg += `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="6" fill="${s.color}" opacity="0.85" style="cursor:pointer" data-skill-click="${s.id}">
        <title>${s.name}: ${s.primaryCount} 会话 (${s.primaryPct}%)</title></rect>`;
      const tx = x + rw / 2, ty = y + rh / 2;
      if (rw > 60 && rh > 30) {
        svg += `<text x="${tx}" y="${ty - 6}" text-anchor="middle" font-size="${rw > 150 ? '15' : '12'}" font-weight="700" fill="#fff" pointer-events="none">${s.icon} ${s.name}</text>`;
        svg += `<text x="${tx}" y="${ty + 14}" text-anchor="middle" font-size="${rw > 150 ? '13' : '11'}" fill="rgba(255,255,255,.85)" pointer-events="none">${s.primaryCount.toLocaleString()} (${s.primaryPct}%)</text>`;
      } else if (rw > 40) {
        svg += `<text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#fff" pointer-events="none">${s.icon}${s.primaryPct}%</text>`;
      }
      curX += rw + GAP;
    });
    curY += rh + GAP;
  });
  svg += `</svg>`;
  const container = document.getElementById(containerId);
  container.innerHTML = svg;
  // 绑定点击事件
  container.querySelectorAll('[data-skill-click]').forEach(el => {
    el.addEventListener('click', () => onSkillClick(el.dataset.skillClick));
  });
}

/**
 * 双柱对比图 - 主场景占比 vs 多标签共现率
 * 关联：场景分析模块，选中的 Skill 高亮
 */
export function renderDualBarSVG(containerId, selectedSkillId, onSkillSelect) {
  const sorted = [...REAL_SKILLS].sort((a, b) => b.primaryPct - a.primaryPct);
  const W = 800, H = 300, PL = 45, PR = 20, PT = 30, PB = 60;
  const cw = W - PL - PR, ch = H - PT - PB;
  const n = sorted.length, gw = cw / n, bw = gw * 0.32, maxY = 55;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = 0; i <= 5; i++) {
    const y = PT + ch - (i * 10 / maxY) * ch;
    svg += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3"/>`;
    svg += `<text x="${PL - 5}" y="${y + 3}" text-anchor="end" font-size="10" fill="#94A3B8">${i * 10}%</text>`;
  }
  sorted.forEach((s, i) => {
    const cx = PL + i * gw + gw / 2;
    const h1 = (s.primaryPct / maxY) * ch, h2 = (s.multiPct / maxY) * ch;
    const y1 = PT + ch - h1, y2 = PT + ch - h2;
    const isSelected = s.id === selectedSkillId;
    const opacity = isSelected ? 1 : 0.75;
    svg += `<rect x="${cx - bw - 1}" y="${y1}" width="${bw}" height="${h1}" rx="3" fill="#4F46E5" opacity="${opacity}" style="cursor:pointer" data-skill-select="${s.id}"><title>${s.name} 主场景: ${s.primaryPct}%</title></rect>`;
    svg += `<rect x="${cx + 1}" y="${y2}" width="${bw}" height="${h2}" rx="3" fill="#3B82F6" opacity="${opacity}" style="cursor:pointer" data-skill-select="${s.id}"><title>${s.name} 多标签: ${s.multiPct}%</title></rect>`;
    svg += `<text x="${cx - bw / 2 - 1}" y="${y1 - 4}" text-anchor="middle" font-size="9" fill="#4F46E5" font-weight="600">${s.primaryPct}</text>`;
    svg += `<text x="${cx + bw / 2 + 1}" y="${y2 - 4}" text-anchor="middle" font-size="9" fill="#3B82F6" font-weight="600">${s.multiPct}</text>`;
    const shortName = s.name.length > 4 ? s.name.slice(0, 4) + '..' : s.name;
    svg += `<text x="${cx}" y="${H - PB + 14}" text-anchor="middle" font-size="10" fill="${isSelected ? 'var(--primary)' : '#94A3B8'}" font-weight="${isSelected ? '700' : '400'}">${s.icon}</text>`;
    svg += `<text x="${cx}" y="${H - PB + 28}" text-anchor="middle" font-size="9" fill="${isSelected ? 'var(--primary)' : '#94A3B8'}" font-weight="${isSelected ? '600' : '400'}">${shortName}</text>`;
    if (isSelected) { svg += `<rect x="${cx - gw / 2 + 2}" y="${H - PB + 34}" width="${gw - 4}" height="3" rx="1.5" fill="var(--primary)"/>`; }
  });
  svg += `<rect x="${W - 180}" y="6" width="10" height="10" rx="2" fill="#4F46E5"/><text x="${W - 166}" y="15" font-size="10" fill="#64748B">主场景占比</text>`;
  svg += `<rect x="${W - 90}" y="6" width="10" height="10" rx="2" fill="#3B82F6"/><text x="${W - 76}" y="15" font-size="10" fill="#64748B">多标签共现率</text>`;
  svg += `</svg>`;
  const container = document.getElementById(containerId);
  container.innerHTML = svg;
  container.querySelectorAll('[data-skill-select]').forEach(el => {
    el.addEventListener('click', () => onSkillSelect(el.dataset.skillSelect));
  });
}

/**
 * 甜甜圈图 - 子场景分布
 */
export function renderDonutSVG(containerId, skillId) {
  const data = SUB_SCENARIO_DATA[skillId] || [];
  const skill = getSkillById(skillId);
  const size = 220, cx = size / 2, cy = size / 2, R = 95, r = 55;

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;width:${size}px;height:${size}px;">`;
  let startAngle = -90;
  data.forEach((d, i) => {
    const angle = d.pct / 100 * 360;
    const endAngle = startAngle + angle;
    const s1 = startAngle * Math.PI / 180, s2 = endAngle * Math.PI / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + R * Math.cos(s1), y1 = cy + R * Math.sin(s1);
    const x2 = cx + R * Math.cos(s2), y2 = cy + R * Math.sin(s2);
    const x3 = cx + r * Math.cos(s2), y3 = cy + r * Math.sin(s2);
    const x4 = cx + r * Math.cos(s1), y4 = cy + r * Math.sin(s1);
    svg += `<path d="M${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${largeArc},0 ${x4},${y4} Z" fill="${CHART_COLORS[i % CHART_COLORS.length]}" opacity="0.85"><title>${d.name}: ${d.pct}%</title></path>`;
    startAngle = endAngle;
  });
  svg += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text)">${skill ? skill.icon : ''}</text>`;
  svg += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11" fill="var(--text-secondary)">${data.length} 子场景</text>`;
  svg += `</svg>`;

  let legend = '<div class="donut-legend">';
  data.forEach((d, i) => {
    legend += `<div class="donut-legend-item"><span class="donut-legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span><span style="flex:1;">${d.name}</span><span style="font-weight:600;color:var(--text);">${d.pct}%</span></div>`;
  });
  legend += '</div>';
  document.getElementById(containerId).innerHTML = svg + legend;
}

/**
 * 能力热力图 - 能力 x Skill 覆盖矩阵
 * 关联：能力矩阵模块，展示能力覆盖情况
 */
export function renderHeatmapSVG(containerId) {
  const caps = [...ALL_CAPABILITIES].sort((a, b) => b.skills.length - a.skills.length);
  const skills = [...REAL_SKILLS].sort((a, b) => b.primaryCount - a.primaryCount);
  const LBL_W = 140, TOP_H = 80, CELL_W = 55, CELL_H = 26, GAP = 2;
  const W = LBL_W + skills.length * (CELL_W + GAP) + 60;
  const H = TOP_H + caps.length * (CELL_H + GAP) + 40;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  skills.forEach((s, i) => {
    const x = LBL_W + i * (CELL_W + GAP) + CELL_W / 2;
    svg += `<text x="${x}" y="${TOP_H - 8}" text-anchor="end" font-size="10" fill="var(--text-secondary)" font-weight="500" transform="rotate(-45,${x},${TOP_H - 8})">${s.icon} ${s.name.slice(0, 5)}</text>`;
  });
  caps.forEach((cap, ri) => {
    const y = TOP_H + ri * (CELL_H + GAP);
    svg += `<text x="${LBL_W - 8}" y="${y + CELL_H / 2 + 4}" text-anchor="end" font-size="10" fill="var(--text-secondary)">${cap.icon} ${cap.name}</text>`;
    skills.forEach((s, ci) => {
      const x = LBL_W + ci * (CELL_W + GAP);
      const has = cap.skills.includes(s.id);
      const fill = has ? (cap.skills.length >= 3 ? '#4F46E5' : '#818CF8') : '#F1F5F9';
      const opacity = has ? (cap.skills.length >= 3 ? 0.9 : 0.6) : 1;
      svg += `<rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" rx="4" fill="${fill}" opacity="${opacity}"><title>${cap.name} x ${s.name}: ${has ? '\u2705 已覆盖' : '\u274C 未覆盖'}</title></rect>`;
      if (has) svg += `<text x="${x + CELL_W / 2}" y="${y + CELL_H / 2 + 4}" text-anchor="middle" font-size="10" fill="#fff" pointer-events="none">\u2713</text>`;
    });
    svg += `<text x="${LBL_W + skills.length * (CELL_W + GAP) + 4}" y="${y + CELL_H / 2 + 4}" font-size="10" fill="var(--text-secondary)">${cap.skills.length}</text>`;
  });
  const sumY = TOP_H + caps.length * (CELL_H + GAP) + 4;
  skills.forEach((s, ci) => {
    const x = LBL_W + ci * (CELL_W + GAP) + CELL_W / 2;
    svg += `<text x="${x}" y="${sumY + 10}" text-anchor="middle" font-size="10" fill="var(--text-secondary)" font-weight="600">${s.capabilities.length}</text>`;
  });
  const lgX = LBL_W, lgY = sumY + 24;
  svg += `<rect x="${lgX}" y="${lgY}" width="16" height="12" rx="3" fill="#4F46E5" opacity="0.9"/><text x="${lgX + 20}" y="${lgY + 10}" font-size="10" fill="var(--text-secondary)">\u901A\u7528\u80FD\u529B(\u22653)</text>`;
  svg += `<rect x="${lgX + 110}" y="${lgY}" width="16" height="12" rx="3" fill="#818CF8" opacity="0.6"/><text x="${lgX + 130}" y="${lgY + 10}" font-size="10" fill="var(--text-secondary)">\u4E13\u7528\u80FD\u529B(1-2)</text>`;
  svg += `<rect x="${lgX + 230}" y="${lgY}" width="16" height="12" rx="3" fill="#F1F5F9"/><text x="${lgX + 250}" y="${lgY + 10}" font-size="10" fill="var(--text-secondary)">\u672A\u8986\u76D6</text>`;
  svg += `</svg>`;
  document.getElementById(containerId).innerHTML = svg;
}

/**
 * 趋势折线图 - CSAT/FCR 30日趋势
 * 关联：监控模块
 */
export function renderSingleTrend(containerId, data, labels, color, label, minV, maxV) {
  const W = 500, H = 180, PL = 40, PR = 15, PT = 15, PB = 30;
  const cw = W - PL - PR, ch = H - PT - PB, n = data.length;
  function cx(i) { return PL + i * (cw / (n - 1)); }
  function cy(v) { return PT + (1 - (v - minV) / (maxV - minV)) * ch; }
  const pts = data.map((v, i) => `${cx(i)},${cy(v)}`).join(' ');
  const area = `${PL},${H - PB} ${pts} ${cx(n - 1)},${H - PB}`;
  const avg = data.reduce((a, b) => a + b, 0) / n;
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = 0; i < 4; i++) { const y = PT + i * (ch / 3); svg += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="4"/>`; }
  svg += `<line x1="${PL}" y1="${cy(avg)}" x2="${W - PR}" y2="${cy(avg)}" stroke="${color}" stroke-dasharray="3" opacity=".3"/>`;
  svg += `<polygon points="${area}" fill="${color}" opacity="0.08"/>`;
  svg += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
  data.forEach((v, i) => { svg += `<circle cx="${cx(i)}" cy="${cy(v)}" r="2.5" fill="${color}"/>`; });
  labels.forEach((l, i) => { if (i % 5 === 0) svg += `<text x="${cx(i)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#94A3B8">${l}</text>`; });
  for (let i = 0; i < 4; i++) { const v = maxV - (maxV - minV) * i / 3; svg += `<text x="${PL - 5}" y="${PT + i * (ch / 3) + 3}" text-anchor="end" font-size="9" fill="#94A3B8">${typeof v === 'number' && v % 1 !== 0 ? v.toFixed(1) : Math.round(v)}</text>`; }
  svg += `<text x="${W - PR}" y="12" text-anchor="end" font-size="10" fill="${color}" font-weight="600">${label}</text>`;
  svg += `</svg>`;
  document.getElementById(containerId).innerHTML = svg;
}

/**
 * 流程图 - 策略执行流程可视化
 * 关联：策略编辑器模块
 */
export function renderFlowchart(containerId, result) {
  const { truncText } = await_import_utils();
  const W = 600, CX = 210, RX = 460, NODE_W = 260, NODE_H = 50, GAP = 24, START_W = 120;
  const condColors = ['#4F46E5', '#7C3AED', '#0284C7', '#D97706'];
  const nCond = result.conditions.length, nAct = result.actions.length;
  const totalNodes = 1 + nCond + 1 + nAct + 1;
  const H = 40 + totalNodes * (NODE_H + GAP) + 70;
  let curY = 30, svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L5,10 L10,0" fill="#CBD5E1"/></marker>
  <marker id="arrowRight" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10" fill="#E2E8F0"/></marker></defs>`;
  function connector(fromY, toY) { return `<line x1="${CX}" y1="${fromY}" x2="${CX}" y2="${toY}" stroke="#CBD5E1" stroke-width="2" marker-end="url(#arrowDown)"/>`; }
  function trunc(str, max) { return !str ? '' : str.length > max ? str.slice(0, max) + '...' : str; }
  const startH = 36;
  svg += `<rect x="${CX - START_W / 2}" y="${curY}" width="${START_W}" height="${startH}" rx="${startH / 2}" fill="#4F46E5"/>`;
  svg += `<text x="${CX}" y="${curY + startH / 2 + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="#fff">\u{1F680} 开始</text>`;
  const startBottom = curY + startH; curY += startH + GAP;
  result.conditions.forEach((c, i) => {
    svg += connector(i === 0 ? startBottom : curY - GAP, curY);
    const clr = condColors[i % condColors.length], nx = CX - NODE_W / 2;
    svg += `<rect x="${nx}" y="${curY}" width="${NODE_W}" height="${NODE_H}" rx="8" fill="#FAFBFC" stroke="#E2E8F0"/>`;
    svg += `<rect x="${nx}" y="${curY}" width="4" height="${NODE_H}" rx="2" fill="${clr}"/>`;
    svg += `<text x="${nx + 14}" y="${curY + 18}" font-size="11" font-weight="600" fill="${clr}">IF \u6761\u4EF6${i + 1}</text>`;
    svg += `<text x="${nx + 14}" y="${curY + 36}" font-size="12" fill="#334155">${trunc(c.field + ' ' + c.op + ' ' + c.value, 22)}</text>`;
    const midY = curY + NODE_H / 2, rightEdge = nx + NODE_W;
    svg += `<line x1="${rightEdge}" y1="${midY}" x2="${RX - 40}" y2="${midY}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#arrowRight)"/>`;
    svg += `<rect x="${RX - 36}" y="${midY - 12}" width="72" height="24" rx="12" fill="#FEE2E2"/>`;
    svg += `<text x="${RX}" y="${midY + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#DC2626">\u274C \u4E0D\u6267\u884C</text>`;
    if (i < nCond - 1) svg += `<text x="${CX + 14}" y="${curY + NODE_H + GAP / 2 + 4}" font-size="10" fill="#94A3B8">\u6EE1\u8DB3 \u2193</text>`;
    curY += NODE_H + GAP;
  });
  svg += connector(curY - GAP, curY);
  const transH = 28;
  svg += `<rect x="${CX - 70}" y="${curY}" width="140" height="${transH}" rx="14" fill="#ECFDF5" stroke="#A7F3D0"/>`;
  svg += `<text x="${CX}" y="${curY + transH / 2 + 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#059669">\u2705 \u5168\u90E8\u6EE1\u8DB3</text>`;
  const transBottom = curY + transH; curY += transH + GAP;
  result.actions.forEach((a, j) => {
    svg += connector(j === 0 ? transBottom : curY - GAP, curY);
    const nx = CX - NODE_W / 2;
    svg += `<rect x="${nx}" y="${curY}" width="${NODE_W}" height="${NODE_H}" rx="8" fill="#F0FDF4" stroke="#BBF7D0"/>`;
    svg += `<rect x="${nx}" y="${curY}" width="4" height="${NODE_H}" rx="2" fill="#059669"/>`;
    svg += `<text x="${nx + 14}" y="${curY + 18}" font-size="11" font-weight="600" fill="#059669">Step ${a.step} \u00B7 ${a.type}</text>`;
    svg += `<text x="${nx + 14}" y="${curY + 36}" font-size="12" fill="#334155">${trunc(a.content, 22)}</text>`;
    curY += NODE_H + GAP;
  });
  svg += connector(curY - GAP, curY);
  const endH = 36;
  svg += `<rect x="${CX - START_W / 2}" y="${curY}" width="${START_W}" height="${endH}" rx="${endH / 2}" fill="#059669"/>`;
  svg += `<text x="${CX}" y="${curY + endH / 2 + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="#fff">\u2705 \u5B8C\u6210</text>`;
  curY += endH + GAP + 8;
  const tagH = 30, scopeW = 240, priW = 120, totalTW = scopeW + 16 + priW, tagStartX = CX - totalTW / 2;
  svg += `<rect x="${tagStartX}" y="${curY}" width="${scopeW}" height="${tagH}" rx="6" fill="#FFFBEB" stroke="#FDE68A"/>`;
  svg += `<text x="${tagStartX + scopeW / 2}" y="${curY + tagH / 2 + 4}" text-anchor="middle" font-size="11" fill="#92400E">\u{1F4CB} ${trunc(result.scope, 20)}</text>`;
  const priX = tagStartX + scopeW + 16, priLabel = result.priority === 0 ? '\u6700\u9AD8' : result.priority === 1 ? '\u9AD8' : '\u6807\u51C6';
  svg += `<rect x="${priX}" y="${curY}" width="${priW}" height="${tagH}" rx="6" fill="#FEF2F2" stroke="#FECACA"/>`;
  svg += `<text x="${priX + priW / 2}" y="${curY + tagH / 2 + 4}" text-anchor="middle" font-size="11" fill="#DC2626">\u26A1 \u4F18\u5148\u7EA7: ${priLabel}</text>`;
  svg += `</svg>`;
  document.getElementById(containerId).innerHTML = svg;
}

// 内部辅助：避免循环依赖
function await_import_utils() {
  return { truncText: (str, max) => !str ? '' : str.length > max ? str.slice(0, max) + '...' : str };
}
