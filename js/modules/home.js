/**
 * 全景总览模块
 * 关联：REAL_SKILLS 汇总 → 点击跳转场景分析
 * 新增：平台架构指引（核心概念 + 使用流程 + 功能模块导航）
 */
import { REAL_SKILLS, ALL_CAPABILITIES } from '../data/skills.js';
import { MOCK_CASES } from '../data/cases.js';
import { NL_TEMPLATES } from '../data/editor.js';
import { animateCounter } from '../utils.js';
import { renderTreemapSVG } from '../charts.js';

// 功能模块导航数据
const NAV_MODULES = [
  { tab: 'workbench', icon: '\u{1F4E4}', name: '\u5206\u6790\u5DE5\u4F5C\u53F0', desc: '\u4E0A\u4F20\u4F1A\u8BDD\u6570\u636E\u5206\u6790' },
  { tab: 'home',      icon: '\u{1F4CA}', name: '\u5168\u666F\u603B\u89C8',     desc: '\u5E73\u53F0\u6570\u636E\u6982\u89C8' },
  { tab: 'graph',     icon: '\u{1F578}\uFE0F', name: '\u77E5\u8BC6\u56FE\u8C31',     desc: '\u4F1A\u8BDD\u6316\u6398\u53EF\u89C6\u5316' },
  { tab: 'dashboard', icon: '\u{1F4C8}', name: '\u573A\u666F\u5206\u6790',     desc: 'Skill \u6DF1\u5EA6\u62C6\u89E3' },
  { tab: 'cases',     icon: '\u{1F4C2}', name: '\u6848\u4F8B\u5E93',       desc: '\u771F\u5B9E\u5DE5\u5355\u77E5\u8BC6\u5E93' },
  { tab: 'editor',    icon: '\u{1F58A}\uFE0F', name: '\u7B56\u7565\u7F16\u8F91\u5668',   desc: 'AI \u89E3\u6790 IF-THEN \u89C4\u5219' },
  { tab: 'kanban',    icon: '\u{1F4CB}', name: '\u770B\u677F',         desc: '\u7B56\u7565\u751F\u547D\u5468\u671F\u7BA1\u7406' },
  { tab: 'monitor',   icon: '\u{1F4C9}', name: '\u76D1\u63A7',         desc: '\u7B56\u7565\u6267\u884C\u6548\u679C\u8FFD\u8E2A' },
  { tab: 'dialog',    icon: '\u{1F4AC}', name: '\u5BF9\u8BDD\u6D4B\u8BD5',     desc: '\u6A21\u62DF\u5BF9\u8BDD\u9A8C\u8BC1\u5339\u914D' },
  { tab: 'matrix',    icon: '\u{1F9E9}', name: '\u80FD\u529B\u77E9\u9635',     desc: '\u80FD\u529B\u8986\u76D6\u5206\u6790' },
  { tab: 'arsenal',   icon: '\u{1F6E1}\uFE0F', name: '\u6B66\u5668\u5E93',       desc: '\u80FD\u529B\u7F3A\u53E3\u4E0E\u5EFA\u8BBE' },
];

// 使用流程步骤数据
const FLOW_STEPS = [
  { icon: '\u{1F50D}', label: '\u4F1A\u8BDD\u6316\u6398', desc: '\u4E0A\u4F20\u539F\u59CB\u4F1A\u8BDD\u6570\u636E\uFF0CAI \u81EA\u52A8\u62C6\u89E3\u573A\u666F', tab: 'workbench' },
  { icon: '\u{1F3AF}', label: 'Skill \u5B9A\u4E49', desc: '\u5B9A\u4E49\u6280\u80FD\u57DF\u4E0E\u5B50\u573A\u666F\u6620\u5C04', tab: 'dashboard' },
  { icon: '\u2699\uFE0F', label: '\u7B56\u7565\u8C03\u4F18', desc: '\u81EA\u7136\u8BED\u8A00\u7F16\u8F91 IF-THEN \u89C4\u5219', tab: 'editor' },
  { icon: '\u{1F9EA}', label: '\u7070\u5EA6\u6D4B\u8BD5', desc: '\u5BF9\u8BDD\u6A21\u62DF\u9A8C\u8BC1\u5339\u914D\u6548\u679C', tab: 'dialog' },
  { icon: '\u{1F680}', label: '\u5168\u91CF\u53D1\u5E03', desc: '\u770B\u677F\u7BA1\u7406\uFF0C\u63A8\u8FDB\u4E0A\u7EBF', tab: 'kanban' },
  { icon: '\u{1F4CA}', label: '\u7EBF\u4E0A\u76D1\u63A7', desc: '\u8FFD\u8E2A CSAT / \u547D\u4E2D\u7387 / \u544A\u8B66', tab: 'monitor' },
];

export function renderHome(onSkillClick) {
  const totalSessions = REAL_SKILLS.reduce((a, s) => a + s.primaryCount, 0);
  const totalSub = REAL_SKILLS.reduce((a, s) => a + s.subScenarios.length, 0);
  const totalRules = REAL_SKILLS.reduce((a, s) => a + s.ruleCount, 0);
  const totalCap = ALL_CAPABILITIES.length;
  const totalCases = MOCK_CASES.length;
  const totalTemplates = NL_TEMPLATES.length;

  // 核心概念 - 三节点架构图
  const archHtml = `
    <div class="guide-arch">
      <div class="guide-arch-node arch-skill">
        <div class="guide-arch-icon">\u{1F3AF}</div>
        <div class="guide-arch-title">Skill \u6280\u80FD\u57DF</div>
        <div class="guide-arch-subtitle">\u670D\u52A1\u573A\u666F\u7684\u9876\u5C42\u5206\u7C7B</div>
        <div class="guide-arch-example">\u5982\uFF1A\u{1F69A}\u7269\u6D41\u8FD0\u8F93 / \u{1F6E1}\uFE0F\u4FE1\u4FDD\u7EA0\u7EB7</div>
      </div>
      <div class="guide-arch-arrow"><span>\u25B8</span>\u5305\u542B</div>
      <div class="guide-arch-node arch-sk">
        <div class="guide-arch-icon">\u{1F4C4}</div>
        <div class="guide-arch-title">\u5B50\u573A\u666F (sk)</div>
        <div class="guide-arch-subtitle">Skill \u4E0B\u7684\u7EC6\u5206\u7528\u4F8B</div>
        <div class="guide-arch-example">\u5982\uFF1A\u9000\u6B3E\u534F\u5546 / \u52A0\u6025\u50AC\u4FC3</div>
      </div>
      <div class="guide-arch-arrow"><span>\u25B8</span>\u8C03\u7528</div>
      <div class="guide-arch-node arch-cap">
        <div class="guide-arch-icon">\u2699\uFE0F</div>
        <div class="guide-arch-title">\u80FD\u529B (Capability)</div>
        <div class="guide-arch-subtitle">\u53EF\u590D\u7528\u7684\u7CFB\u7EDF API \u5408\u7EA6</div>
        <div class="guide-arch-example">\u5982\uFF1A\u67E5\u8BE2\u8BA2\u5355 / \u521B\u5EFA\u5DE5\u5355</div>
      </div>
    </div>`;

  // 使用流程 - 6步
  const flowHtml = FLOW_STEPS.map(s => `
    <div class="guide-flow-step" data-nav-tab="${s.tab}">
      <div class="guide-flow-icon">${s.icon}</div>
      <div class="guide-flow-label">${s.label}</div>
      <div class="guide-flow-desc">${s.desc}</div>
    </div>`).join('');

  // 功能模块导航卡片
  const modulesHtml = NAV_MODULES.map(m => `
    <div class="guide-module-card" data-nav-tab="${m.tab}">
      <span class="guide-module-icon">${m.icon}</span>
      <div class="guide-module-info">
        <div class="guide-module-name">${m.name}</div>
        <div class="guide-module-desc">${m.desc}</div>
      </div>
    </div>`).join('');

  // Skill Pills
  const pillsHtml = REAL_SKILLS.map(s =>
    `<div class="skill-pill" data-nav-skill="${s.id}" style="border-color:${s.color}30;">
      <span>${s.icon}</span><span>${s.name}</span><span class="pill-pct">${s.primaryPct}%</span>
    </div>`).join('');

  const el = document.getElementById('sec-home');
  el.innerHTML = `
<div class="home-hero">
  <h1>Skills \u7B56\u7565\u4E2D\u5FC3 \u00B7 \u5168\u666F\u603B\u89C8</h1>
  <p>\u5F53\u524D\u5DF2\u786E\u8BA4 ${REAL_SKILLS.length} \u5927\u6838\u5FC3 Skill\uFF0C\u8986\u76D6 ${totalSub} \u4E2A\u5B50\u573A\u666F\uFF0C\u6C89\u6DC0 ${totalCases} \u6761\u6848\u4F8B\u548C ${totalTemplates} \u6761\u7B56\u7565\u6A21\u677F\uFF0C\u9A71\u52A8 ${totalCap} \u79CD\u7CFB\u7EDF\u80FD\u529B\u3002</p>
  <div class="home-hero-stats">
    <div class="home-hero-stat"><div class="val" id="cnt-sessions">0</div><div class="lbl">\u5DF2\u786E\u8BA4\u4F1A\u8BDD</div></div>
    <div class="home-hero-stat"><div class="val" id="cnt-skills">0</div><div class="lbl">Skill \u6280\u80FD</div></div>
    <div class="home-hero-stat"><div class="val" id="cnt-subs">0</div><div class="lbl">\u5B50\u573A\u666F</div></div>
    <div class="home-hero-stat"><div class="val" id="cnt-rules">0</div><div class="lbl">\u7B56\u7565\u89C4\u5219</div></div>
    <div class="home-hero-stat"><div class="val" id="cnt-caps">0</div><div class="lbl">\u7CFB\u7EDF\u80FD\u529B</div></div>
  </div>
</div>

<div class="guide-section">
  <h3>\u{1F3D7}\uFE0F \u5E73\u53F0\u67B6\u6784\u6307\u5F15</h3>
  <p style="font-size:13px;color:var(--text-secondary);margin:-8px 0 12px;line-height:1.6;">\u672C\u5E73\u53F0\u57FA\u4E8E\u300C\u573A\u666F\u9A71\u52A8 + \u80FD\u529B\u590D\u7528\u300D\u7684\u67B6\u6784\u601D\u8DEF\uFF0C\u5C06\u5BA2\u670D\u4F1A\u8BDD\u62C6\u89E3\u4E3A Skill \u2192 \u5B50\u573A\u666F(sk) \u2192 \u80FD\u529B(Capability) \u4E09\u5C42\u7ED3\u6784\uFF0C\u6BCF\u4E2A\u5C42\u7EA7\u53EF\u72EC\u7ACB\u7BA1\u7406\u3001\u8FED\u4EE3\u548C\u590D\u7528\u3002</p>
  ${archHtml}
  <h4>\u{1F4CB} \u4F7F\u7528\u6D41\u7A0B</h4>
  <p style="font-size:12px;color:var(--text-secondary);margin:-4px 0 8px;">\u4ECE\u6570\u636E\u6316\u6398\u5230\u7EBF\u4E0A\u76D1\u63A7\uFF0C\u5B8C\u6574\u7684 Skill \u7B56\u7565\u751F\u547D\u5468\u671F\u52A8\u7EBF\uFF1A</p>
  <div class="guide-flow">${flowHtml}</div>
  <h4>\u{1F9E9} \u529F\u80FD\u6A21\u5757</h4>
  <div class="guide-modules">${modulesHtml}</div>
</div>

<div class="treemap-row">
  <div class="treemap-wrap" style="margin-bottom:0;"><h3>Skill \u573A\u666F\u5206\u5E03 Treemap</h3><div id="homeTreemap"></div></div>
  <div class="chart-card">
    <h3>\u5FEB\u901F\u5BFC\u822A \u2014 \u70B9\u51FB\u8FDB\u5165\u573A\u666F\u5206\u6790</h3>
    <div class="skill-pills" id="homeSkillPills">${pillsHtml}</div>
  </div>
</div>`;

  // 绑定 Skill Pills 事件
  document.getElementById('homeSkillPills').querySelectorAll('[data-nav-skill]').forEach(el => {
    el.addEventListener('click', () => onSkillClick(el.dataset.navSkill));
  });

  // 绑定模块导航 + 流程步骤点击事件
  document.querySelectorAll('#sec-home [data-nav-tab]').forEach(el => {
    el.addEventListener('click', () => {
      if (window.sscSwitchTab) window.sscSwitchTab(el.dataset.navTab);
    });
  });

  // 数字动画
  setTimeout(() => {
    animateCounter(document.getElementById('cnt-sessions'), totalSessions);
    animateCounter(document.getElementById('cnt-skills'), REAL_SKILLS.length);
    animateCounter(document.getElementById('cnt-subs'), totalSub);
    animateCounter(document.getElementById('cnt-rules'), totalRules);
    animateCounter(document.getElementById('cnt-caps'), totalCap);
  }, 200);

  // Treemap
  renderTreemapSVG('homeTreemap', onSkillClick);
}
