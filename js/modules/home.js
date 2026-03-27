/**
 * 全景总览模块
 * 关联：REAL_SKILLS 汇总 → 点击跳转场景分析
 */
import { REAL_SKILLS } from '../data/skills.js';
import { animateCounter } from '../utils.js';
import { renderTreemapSVG } from '../charts.js';

export function renderHome(onSkillClick) {
  const totalValid = 3794;
  const totalSub = REAL_SKILLS.reduce((a, s) => a + s.subScenarios.length, 0);
  const totalRules = REAL_SKILLS.reduce((a, s) => a + s.ruleCount, 0);
  const totalCap = 21; // ALL_CAPABILITIES.length

  const el = document.getElementById('sec-home');
  el.innerHTML = `
<div class="home-hero">
  <h1>5000 会话 \u00B7 ${REAL_SKILLS.length} 大技能 \u00B7 全景总览</h1>
  <p>基于 5000 条真实客服会话的深度分析，将商家服务场景拆解为 ${REAL_SKILLS.length} 大核心 Skill，覆盖 ${totalSub} 个子场景，共 ${totalRules} 条 IF-THEN 策略规则，驱动 ${totalCap} 种系统能力。</p>
  <div class="home-hero-stats">
    <div class="home-hero-stat"><div class="val" id="cnt-sessions">0</div><div class="lbl">有效会话</div></div>
    <div class="home-hero-stat"><div class="val" id="cnt-subs">0</div><div class="lbl">子场景</div></div>
    <div class="home-hero-stat"><div class="val" id="cnt-rules">0</div><div class="lbl">IF-THEN 规则</div></div>
    <div class="home-hero-stat"><div class="val" id="cnt-caps">0</div><div class="lbl">能力类型</div></div>
  </div>
</div>
<div class="treemap-wrap"><h3>Skill 场景分布 Treemap（按主场景会话量）</h3><div id="homeTreemap"></div></div>
<h3 style="font-size:15px;font-weight:600;margin-bottom:12px;">快速导航 \u2014 点击进入场景分析</h3>
<div class="skill-pills" id="homeSkillPills"></div>`;

  // 渲染 Skill 导航药丸
  const pillsContainer = document.getElementById('homeSkillPills');
  pillsContainer.innerHTML = REAL_SKILLS.map(s =>
    `<div class="skill-pill" data-nav-skill="${s.id}" style="border-color:${s.color}30;">
      <span>${s.icon}</span><span>${s.name}</span><span class="pill-pct">${s.primaryPct}%</span>
    </div>`
  ).join('');
  pillsContainer.querySelectorAll('[data-nav-skill]').forEach(el => {
    el.addEventListener('click', () => onSkillClick(el.dataset.navSkill));
  });

  // 数字动画
  setTimeout(() => {
    animateCounter(document.getElementById('cnt-sessions'), totalValid);
    animateCounter(document.getElementById('cnt-subs'), totalSub);
    animateCounter(document.getElementById('cnt-rules'), totalRules);
    animateCounter(document.getElementById('cnt-caps'), totalCap);
  }, 200);

  // Treemap
  renderTreemapSVG('homeTreemap', onSkillClick);
}
