/**
 * 能力矩阵模块
 * 关联：ALL_CAPABILITIES x REAL_SKILLS 交叉分析
 * 暴露能力覆盖缺口，与武器库模块关联
 */
import { REAL_SKILLS, ALL_CAPABILITIES } from '../data/skills.js';
import { renderHeatmapSVG } from '../charts.js';

export function renderMatrix() {
  const total = ALL_CAPABILITIES.length;
  const universal = ALL_CAPABILITIES.filter(c => c.skills.length >= 3).length;
  const exclusive = ALL_CAPABILITIES.filter(c => c.skills.length === 1).length;
  const avgCap = (REAL_SKILLS.reduce((a, s) => a + s.capabilities.length, 0) / REAL_SKILLS.length).toFixed(1);

  let html = `
    <h1 class="section-title">能力矩阵</h1>
    <p class="section-desc">${total} 种系统能力 \u00D7 ${REAL_SKILLS.length} 个 Skill 的覆盖分析 <button class="module-nav-link" id="matrixToArsenal">查看能力缺口 \u2192</button></p>
    <div class="stats-grid">
      <div class="stat-card purple"><div class="label">能力类型</div><div class="value">${total}</div></div>
      <div class="stat-card green"><div class="label">通用能力 (\u22653 Skill)</div><div class="value">${universal}</div></div>
      <div class="stat-card amber"><div class="label">专用能力 (1 Skill)</div><div class="value">${exclusive}</div></div>
      <div class="stat-card red"><div class="label">平均每 Skill 能力数</div><div class="value">${avgCap}</div></div>
    </div>
    <div class="heatmap-wrap"><h3>能力 \u00D7 Skill 覆盖热力图</h3><div id="heatmapChart"></div></div>`;
  document.getElementById('sec-matrix').innerHTML = html;
  document.getElementById('matrixToArsenal').addEventListener('click', () => {
    if (window.sscSwitchTab) window.sscSwitchTab('arsenal');
  });
  renderHeatmapSVG('heatmapChart');
}
