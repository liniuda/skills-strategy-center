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
    <p class="section-desc">\u300C\u80FD\u529B\u300D\u6307 AI Agent \u53EF\u8C03\u7528\u7684\u6267\u884C\u52A8\u4F5C\uFF08\u5982\u67E5\u8BE2\u7269\u6D41\u3001\u521B\u5EFA\u5DE5\u5355\u3001\u8054\u7CFB\u4E70\u5BB6\u7B49\uFF09\u3002\u4E0B\u65B9\u70ED\u529B\u56FE\u5C55\u793A ${total} \u79CD\u6267\u884C\u80FD\u529B\u5728 ${REAL_SKILLS.length} \u4E2A Skill \u573A\u666F\u4E2D\u7684\u8986\u76D6\u60C5\u51B5\uFF0C\u5E2E\u52A9\u8BC6\u522B\u80FD\u529B\u7F3A\u53E3\u3002 <button class="module-nav-link" id="matrixToArsenal">\u67E5\u770B\u80FD\u529B\u7F3A\u53E3 \u2192</button></p>
    <div class="stats-grid">
      <div class="stat-card purple"><div class="label">\u6267\u884C\u80FD\u529B\u603B\u6570</div><div class="value">${total}</div></div>
      <div class="stat-card green"><div class="label">\u8DE8\u573A\u666F\u901A\u7528\u80FD\u529B<div style="font-size:10px;font-weight:400;color:var(--text-secondary);margin-top:2px;">\u88AB 3+ \u4E2A Skill \u5171\u4EAB</div></div><div class="value">${universal}</div></div>
      <div class="stat-card amber"><div class="label">\u573A\u666F\u4E13\u5C5E\u80FD\u529B<div style="font-size:10px;font-weight:400;color:var(--text-secondary);margin-top:2px;">\u4EC5 1 \u4E2A Skill \u4F7F\u7528</div></div><div class="value">${exclusive}</div></div>
      <div class="stat-card red"><div class="label">\u5E73\u5747\u80FD\u529B\u8986\u76D6<div style="font-size:10px;font-weight:400;color:var(--text-secondary);margin-top:2px;">\u6BCF\u4E2A Skill \u5E73\u5747\u8C03\u7528\u7684\u80FD\u529B\u6570</div></div><div class="value">${avgCap}</div></div>
    </div>
    <div class="heatmap-wrap"><h3>\u6267\u884C\u80FD\u529B \u00D7 Skill \u573A\u666F\u8986\u76D6\u70ED\u529B\u56FE</h3><div style="font-size:12px;color:var(--text-secondary);margin:-8px 0 16px;">\u60AC\u505C\u67E5\u770B\u8BE6\u60C5\uFF0C\u70B9\u51FB\u672A\u8986\u76D6\u5355\u5143\u683C\u53EF\u8DF3\u8F6C\u6B66\u5668\u5E93</div><div id="heatmapChart" style="position:relative;"></div></div>`;
  document.getElementById('sec-matrix').innerHTML = html;
  document.getElementById('matrixToArsenal').addEventListener('click', () => {
    if (window.sscSwitchTab) window.sscSwitchTab('arsenal');
  });
  renderHeatmapSVG('heatmapChart');
}
