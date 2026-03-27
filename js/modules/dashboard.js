/**
 * 场景分析模块
 * 关联：REAL_SKILLS + SUB_SCENARIO_DATA → 选择 Skill 查看详情
 */
import { REAL_SKILLS, getSkillById } from '../data/skills.js';
import { renderDualBarSVG, renderDonutSVG } from '../charts.js';

export function renderDashboard(selectedSkillId, onSkillSelect) {
  const totalValid = 3794;
  const totalRules = REAL_SKILLS.reduce((a, s) => a + s.ruleCount, 0);
  const maxMulti = Math.max(...REAL_SKILLS.map(s => s.multiPct));
  const sel = getSkillById(selectedSkillId) || REAL_SKILLS[0];

  let html = `
    <h1 class="section-title">场景分析</h1>
    <p class="section-desc">多维度 Skill 场景数据分析 \u2014 主场景 vs 多标签共现率对比</p>
    <div class="stats-grid">
      <div class="stat-card purple"><div class="label">有效会话总量</div><div class="value">${totalValid.toLocaleString()}</div></div>
      <div class="stat-card green"><div class="label">核心 Skills</div><div class="value">${REAL_SKILLS.length}</div></div>
      <div class="stat-card amber"><div class="label">最高多标签率</div><div class="value">${maxMulti}%</div></div>
      <div class="stat-card red"><div class="label">IF-THEN 规则</div><div class="value">${totalRules}</div></div>
    </div>
    <div class="skill-pills" id="dashboardPills" style="margin-bottom:16px;"></div>
    <div class="chart-card" style="margin-bottom:16px;"><h3>主场景占比 vs 多标签共现率</h3><div id="dualBarChart"></div></div>
    <div class="chart-row">
      <div class="chart-card"><h3>${sel.icon} ${sel.name} \u2014 子场景分布</h3><div id="donutChart" class="donut-container"></div></div>
      <div class="skill-detail-panel">
        <h3>${sel.icon} ${sel.name}</h3>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px;">${sel.desc}</p>
        <div class="skill-detail-meta">
          <span class="skill-detail-badge" style="background:${sel.color}15;color:${sel.color};">主场景 ${sel.primaryCount} 会话 (${sel.primaryPct}%)</span>
          <span class="skill-detail-badge" style="background:#3B82F615;color:#3B82F6;">多标签 ${sel.multiCount} 会话 (${sel.multiPct}%)</span>
        </div>
        <div class="skill-detail-meta">
          <span class="skill-detail-badge" style="background:#F1F5F9;color:var(--text);">${sel.subScenarios.length} 子场景</span>
          <span class="skill-detail-badge" style="background:#F1F5F9;color:var(--text);">${sel.ruleCount} 条规则</span>
          <span class="skill-detail-badge" style="background:#F1F5F9;color:var(--text);">${sel.capabilities.length} 种能力</span>
          <span class="skill-detail-badge" style="background:#EEF2FF;color:var(--primary);">${sel.status} \u00B7 ${sel.version}</span>
        </div>
        <h4 style="font-size:13px;font-weight:600;margin:12px 0 8px;">子场景列表</h4>
        <ul class="skill-sample-list">${sel.subScenarios.map((s, i) => `<li>${i + 1}. ${s}</li>`).join('')}</ul>
      </div>
    </div>`;
  document.getElementById('sec-dashboard').innerHTML = html;

  // 渲染 Skill 选择药丸
  const pillsContainer = document.getElementById('dashboardPills');
  pillsContainer.innerHTML = REAL_SKILLS.map(s =>
    `<div class="skill-pill${s.id === selectedSkillId ? ' active' : ''}" data-select-skill="${s.id}" style="border-color:${s.color}${s.id === selectedSkillId ? '' : '30'};">${s.icon} ${s.name}</div>`
  ).join('');
  pillsContainer.querySelectorAll('[data-select-skill]').forEach(el => {
    el.addEventListener('click', () => onSkillSelect(el.dataset.selectSkill));
  });

  // 渲染图表
  renderDualBarSVG('dualBarChart', selectedSkillId, onSkillSelect);
  renderDonutSVG('donutChart', selectedSkillId);
}
