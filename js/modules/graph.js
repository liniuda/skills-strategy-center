/**
 * 知识图谱模块 - 神经网络风格可视化
 * 基于5000条客服会话的深度挖掘数据
 */
import { GRAPH_NODES, GRAPH_EDGES, GRAPH_STATS, LAYER_CONFIG } from '../data/graph.js';
import { animateCounter } from '../utils.js';

const W = 1200, H = 720;
const PAD_TOP = 55, PAD_BOT = 30, PAD_X = 20;
const LAYER_X = [110, 420, 740, 1060];
const MAX_R = [26, 20, 18, 16];
const MIN_R = 6;

/* ── 坐标计算 ── */
function computeLayout() {
  const nodeMap = {};
  for (let li = 0; li < 4; li++) {
    const layerNodes = GRAPH_NODES.filter(n => n.layer === li)
      .sort((a, b) => b.pct - a.pct);
    const n = layerNodes.length;
    const avail = H - PAD_TOP - PAD_BOT;
    const gap = avail / (n + 1);
    // center-weighted: place highest pct in center
    const ordered = centerWeight(layerNodes);
    const maxPct = layerNodes[0]?.pct || 1;
    ordered.forEach((node, i) => {
      const r = MIN_R + (node.pct / maxPct) * (MAX_R[li] - MIN_R);
      nodeMap[node.id] = {
        ...node,
        x: LAYER_X[li],
        y: PAD_TOP + gap * (i + 1),
        r
      };
    });
  }
  return nodeMap;
}

function centerWeight(arr) {
  const out = new Array(arr.length);
  let lo = 0, hi = arr.length - 1;
  const mid = Math.floor(arr.length / 2);
  let left = mid, right = mid + 1;
  for (let i = 0; i < arr.length; i++) {
    if (i % 2 === 0) {
      out[left--] = arr[i];
      if (left < lo) left = right;
    } else {
      out[right++] = arr[i];
      if (right > hi) right = left;
    }
  }
  return out;
}

/* ── 邻接表 ── */
function buildAdjacency() {
  const adj = {};
  GRAPH_NODES.forEach(n => { adj[n.id] = new Set(); });
  GRAPH_EDGES.forEach(e => {
    adj[e.from].add(e.to);
    adj[e.to].add(e.from);
  });
  return adj;
}

/* ── BFS 路径追踪 ── */
function findConnectedPath(startId, adj) {
  const visited = new Set([startId]);
  const queue = [startId];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of adj[cur]) {
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }
  }
  return visited;
}

/* ── SVG 构建 ── */
function buildSVG(nodeMap) {
  const nodes = Object.values(nodeMap);
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;

  // defs
  svg += '<defs>';
  // gradients
  for (let i = 0; i < 3; i++) {
    const c1 = LAYER_CONFIG[i].color, c2 = LAYER_CONFIG[i + 1].color;
    svg += `<linearGradient id="grad-${i}-${i+1}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>`;
  }
  // glow filters
  LAYER_CONFIG.forEach((lc, i) => {
    svg += `<filter id="glow-${i}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  });
  // dot pattern bg
  svg += `<pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
    <circle cx="10" cy="10" r="0.5" fill="rgba(255,255,255,0.06)"/>
  </pattern>`;
  svg += '</defs>';

  // dark background
  svg += `<rect width="${W}" height="${H}" rx="12" fill="url(#bgGrad)"/>`;
  svg += `<defs><linearGradient id="bgGrad" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#0F172A"/>
    <stop offset="100%" stop-color="#1E293B"/>
  </linearGradient></defs>`;
  svg += `<rect width="${W}" height="${H}" rx="12" fill="url(#dotGrid)"/>`;

  // layer labels
  LAYER_CONFIG.forEach((lc, i) => {
    const x = LAYER_X[i];
    svg += `<text x="${x}" y="28" text-anchor="middle" font-size="13" font-weight="700" fill="${lc.glow}" opacity="0.9">${lc.name}</text>`;
    svg += `<line x1="${x - 22}" y1="36" x2="${x + 22}" y2="36" stroke="${lc.color}" stroke-width="2" opacity="0.3" stroke-linecap="round"/>`;
  });

  // edges (bottom layer)
  svg += '<g class="graph-edges">';
  GRAPH_EDGES.forEach((e, idx) => {
    const from = nodeMap[e.from], to = nodeMap[e.to];
    if (!from || !to) return;
    const dx = to.x - from.x;
    const cp1x = from.x + dx * 0.4, cp2x = to.x - dx * 0.4;
    const gradId = `grad-${from.layer}-${to.layer}`;
    const sw = 0.8 + e.weight * 2.5;
    const op = 0.06 + e.weight * 0.1;
    const delay = 0.2 + (from.layer * 0.3) + (idx % 10) * 0.02;
    svg += `<path class="graph-edge" 
      d="M${from.x},${from.y} C${cp1x},${from.y} ${cp2x},${to.y} ${to.x},${to.y}"
      stroke="url(#${gradId})" stroke-width="${sw}" fill="none"
      opacity="${op}" stroke-linecap="round"
      data-edge-from="${e.from}" data-edge-to="${e.to}" data-edge-weight="${e.weight}"
      style="animation-delay:${delay}s"/>`;
  });
  svg += '</g>';

  // glow circles for high-pct nodes
  svg += '<g class="graph-glows">';
  nodes.forEach(n => {
    if (n.pct >= 10) {
      const lc = LAYER_CONFIG[n.layer];
      const delay = n.layer * 0.3 + Math.random() * 0.5;
      svg += `<circle class="graph-glow" cx="${n.x}" cy="${n.y}" r="${n.r + 8}"
        fill="${lc.glow}" opacity="0.12"
        style="transform-origin:${n.x}px ${n.y}px;animation-delay:${delay}s"/>`;
    }
  });
  svg += '</g>';

  // nodes
  svg += '<g class="graph-nodes">';
  nodes.forEach(n => {
    const lc = LAYER_CONFIG[n.layer];
    const delay = n.layer * 0.25;
    const useFilter = n.pct >= 15 ? `filter="url(#glow-${n.layer})"` : '';
    // label position: layers 0,1 on right; layers 2,3 on left
    const labelX = n.layer <= 1 ? n.x + n.r + 8 : n.x - n.r - 8;
    const anchor = n.layer <= 1 ? 'start' : 'end';
    const displayName = n.name.length > 7 ? n.name.slice(0, 6) + '..' : n.name;

    svg += `<g class="graph-node" data-node-id="${n.id}" style="animation-delay:${delay}s">
      <circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${lc.color}" ${useFilter}
        stroke="rgba(255,255,255,0.25)" stroke-width="${n.pct >= 10 ? 1.5 : 0.5}"/>
      <text x="${labelX}" y="${n.y + 1}" text-anchor="${anchor}" dominant-baseline="middle"
        font-size="${n.pct >= 5 ? 11 : 10}" fill="rgba(255,255,255,0.85)" font-weight="${n.pct >= 10 ? 600 : 400}"
        pointer-events="none">${displayName}</text>`;
    if (n.pct >= 8) {
      svg += `<text x="${labelX}" y="${n.y + 14}" text-anchor="${anchor}" dominant-baseline="middle"
        font-size="9" fill="rgba(255,255,255,0.45)" pointer-events="none">${n.pct}%</text>`;
    }
    svg += '</g>';
  });
  svg += '</g>';

  svg += '</svg>';
  return svg;
}

/* ── 主渲染函数 ── */
export function renderGraph() {
  const el = document.getElementById('sec-graph');
  const st = GRAPH_STATS;

  el.innerHTML = `
    <h1 class="section-title">知识图谱</h1>
    <p class="section-desc">基于 ${st.totalConversations.toLocaleString()} 条客服会话的深度挖掘，构建问题域 → 场景 → 解决方案 → 满意因素的四层神经网络知识图谱</p>

    <div class="stats-grid">
      <div class="stat-card purple">
        <div class="label">有效会话</div>
        <div class="value" id="graphStat1">${st.validConversations.toLocaleString()}</div>
      </div>
      <div class="stat-card green">
        <div class="label">技能域</div>
        <div class="value" id="graphStat2">${st.skillsIdentified}</div>
      </div>
      <div class="stat-card amber">
        <div class="label">映射场景</div>
        <div class="value" id="graphStat3">${st.scenariosMapped}</div>
      </div>
      <div class="stat-card red">
        <div class="label">满意因素</div>
        <div class="value" id="graphStat4">${st.satisfactionFactors}</div>
      </div>
    </div>

    <div class="graph-wrap">
      <div class="graph-header">
        <h3>Neural Knowledge Graph</h3>
        <div class="graph-legend">
          ${LAYER_CONFIG.map(lc =>
            `<span class="graph-legend-item">
              <span class="graph-legend-dot" style="background:${lc.color}"></span>${lc.name}
            </span>`
          ).join('')}
        </div>
      </div>
      <div id="graphSvgContainer" style="position:relative"></div>
      <div class="graph-tooltip" id="graphTooltip"></div>
    </div>`;

  // render SVG
  const nodeMap = computeLayout();
  document.getElementById('graphSvgContainer').innerHTML = buildSVG(nodeMap);

  // animate stat counters
  animateCounter('graphStat1', st.validConversations);
  animateCounter('graphStat2', st.skillsIdentified);
  animateCounter('graphStat3', st.scenariosMapped);
  animateCounter('graphStat4', st.satisfactionFactors);

  // build adjacency
  const adj = buildAdjacency();
  let activeNodeId = null;

  // interaction
  const svgEl = document.querySelector('#graphSvgContainer svg');
  const tooltipEl = document.getElementById('graphTooltip');
  const wrapEl = document.querySelector('.graph-wrap');

  svgEl.addEventListener('mouseover', (e) => {
    const g = e.target.closest('[data-node-id]');
    if (!g) return;
    const nid = g.dataset.nodeId;
    if (activeNodeId) return; // click mode active
    highlightNode(nid, nodeMap, adj, svgEl);
    showTooltip(nid, e, nodeMap, adj, tooltipEl, wrapEl);
  });

  svgEl.addEventListener('mousemove', (e) => {
    const g = e.target.closest('[data-node-id]');
    if (!g || activeNodeId) return;
    moveTooltip(e, tooltipEl, wrapEl);
  });

  svgEl.addEventListener('mouseout', (e) => {
    const g = e.target.closest('[data-node-id]');
    if (!g || activeNodeId) return;
    resetHighlight(svgEl);
    tooltipEl.classList.remove('visible');
  });

  svgEl.addEventListener('click', (e) => {
    const g = e.target.closest('[data-node-id]');
    if (g) {
      const nid = g.dataset.nodeId;
      if (activeNodeId === nid) {
        activeNodeId = null;
        resetHighlight(svgEl);
        tooltipEl.classList.remove('visible');
      } else {
        activeNodeId = nid;
        const pathNodes = findConnectedPath(nid, adj);
        highlightPath(nid, pathNodes, svgEl);
        showTooltip(nid, e, nodeMap, adj, tooltipEl, wrapEl);
      }
    } else {
      if (activeNodeId) {
        activeNodeId = null;
        resetHighlight(svgEl);
        tooltipEl.classList.remove('visible');
      }
    }
  });
}

/* ── 高亮逻辑 ── */
function highlightNode(nid, nodeMap, adj, svgEl) {
  const connected = adj[nid];
  // dim all nodes
  svgEl.querySelectorAll('.graph-node').forEach(g => {
    const id = g.dataset.nodeId;
    if (id === nid) {
      g.classList.add('graph-node-hover');
      g.classList.remove('graph-node-dimmed');
    } else if (connected.has(id)) {
      g.classList.add('graph-node-connected');
      g.classList.remove('graph-node-dimmed');
    } else {
      g.classList.add('graph-node-dimmed');
      g.classList.remove('graph-node-hover', 'graph-node-connected');
    }
  });
  // edges
  svgEl.querySelectorAll('.graph-edge').forEach(p => {
    const from = p.dataset.edgeFrom, to = p.dataset.edgeTo;
    if (from === nid || to === nid) {
      const w = parseFloat(p.dataset.edgeWeight);
      p.style.opacity = 0.4 + w * 0.5;
      p.style.strokeWidth = (2 + w * 4) + 'px';
      p.classList.add('graph-edge-active');
    } else {
      p.style.opacity = '0.02';
      p.style.strokeWidth = '';
      p.classList.remove('graph-edge-active');
    }
  });
  // glows
  svgEl.querySelectorAll('.graph-glow').forEach(c => {
    c.style.opacity = '0.04';
  });
}

function highlightPath(nid, pathNodes, svgEl) {
  svgEl.querySelectorAll('.graph-node').forEach(g => {
    const id = g.dataset.nodeId;
    if (id === nid) {
      g.classList.add('graph-node-hover');
      g.classList.remove('graph-node-dimmed', 'graph-node-connected');
    } else if (pathNodes.has(id)) {
      g.classList.add('graph-node-connected');
      g.classList.remove('graph-node-dimmed', 'graph-node-hover');
    } else {
      g.classList.add('graph-node-dimmed');
      g.classList.remove('graph-node-hover', 'graph-node-connected');
    }
  });
  svgEl.querySelectorAll('.graph-edge').forEach(p => {
    const from = p.dataset.edgeFrom, to = p.dataset.edgeTo;
    if (pathNodes.has(from) && pathNodes.has(to)) {
      const w = parseFloat(p.dataset.edgeWeight);
      p.style.opacity = 0.35 + w * 0.5;
      p.style.strokeWidth = (1.5 + w * 3.5) + 'px';
      p.classList.add('graph-edge-active');
    } else {
      p.style.opacity = '0.01';
      p.style.strokeWidth = '';
      p.classList.remove('graph-edge-active');
    }
  });
  svgEl.querySelectorAll('.graph-glow').forEach(c => { c.style.opacity = '0.04'; });
}

function resetHighlight(svgEl) {
  svgEl.querySelectorAll('.graph-node').forEach(g => {
    g.classList.remove('graph-node-hover', 'graph-node-connected', 'graph-node-dimmed');
  });
  svgEl.querySelectorAll('.graph-edge').forEach(p => {
    p.style.opacity = '';
    p.style.strokeWidth = '';
    p.classList.remove('graph-edge-active');
  });
  svgEl.querySelectorAll('.graph-glow').forEach(c => { c.style.opacity = ''; });
}

/* ── Tooltip ── */
function showTooltip(nid, e, nodeMap, adj, tooltipEl, wrapEl) {
  const n = nodeMap[nid];
  if (!n) return;
  const lc = LAYER_CONFIG[n.layer];
  const connCount = adj[nid].size;
  tooltipEl.innerHTML = `
    <div class="graph-tooltip-title">${n.name}</div>
    <span class="graph-tooltip-layer" style="background:${lc.color}20;color:${lc.color}">${lc.name}</span>
    <div class="graph-tooltip-stat" style="color:${lc.color}">${n.pct}%</div>
    <div class="graph-tooltip-count">${n.count.toLocaleString()} 次出现</div>
    <div class="graph-tooltip-desc">${n.desc}</div>
    <div class="graph-tooltip-links">关联节点: ${connCount} 个</div>`;
  tooltipEl.style.borderLeftColor = lc.color;
  moveTooltip(e, tooltipEl, wrapEl);
  tooltipEl.classList.add('visible');
}

function moveTooltip(e, tooltipEl, wrapEl) {
  const rect = wrapEl.getBoundingClientRect();
  let x = e.clientX - rect.left + 16;
  let y = e.clientY - rect.top - 10;
  // boundary checks
  const tw = 260, th = 200;
  if (x + tw > rect.width) x = e.clientX - rect.left - tw - 10;
  if (y + th > rect.height) y = rect.height - th - 10;
  if (y < 0) y = 10;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top = y + 'px';
}
