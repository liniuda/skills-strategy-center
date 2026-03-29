/**
 * 监控中心模块
 * 关联：追踪已发布 Skills 的 CSAT/FCR 指标
 * A/B 测试比较版本效果，告警触发关联 Skills 运行状态
 * 支持：告警可点击交互、活动日志渲染
 */
import { REAL_SKILLS } from '../data/skills.js';
import { MOCK_ALERTS, MOCK_ACTIVITIES, TREND_DATA } from '../data/monitor.js';
import { renderSingleTrend } from '../charts.js';
import { showToast } from '../utils.js';

export function renderMonitor() {
  const active = REAL_SKILLS.filter(s => ['published', 'canary'].includes(s.status)).length;
  const unhandled = MOCK_ALERTS.filter(a => !a.handled).length;
  let html = `
    <h1 class="section-title">监控中心</h1>
    <p class="section-desc">实时追踪 Skills 策略执行效果 <button class="module-nav-link" id="monitorToKanban">查看策略看板 \u2192</button></p>
    <div class="stats-grid">
      <div class="stat-card purple"><div class="label">活跃 Skills</div><div class="value">${active}</div></div>
      <div class="stat-card green"><div class="label">平均 CSAT</div><div class="value">4.2</div></div>
      <div class="stat-card amber"><div class="label">FCR 首次解决率</div><div class="value">82%</div></div>
      <div class="stat-card red"><div class="label">未处理告警</div><div class="value">${unhandled}</div></div>
    </div>
    <div class="chart-row">
      <div class="chart-card"><h3>CSAT 30日趋势</h3><div id="csatTrend30" class="trend-chart"></div></div>
      <div class="chart-card"><h3>FCR 30日趋势</h3><div id="fcrTrend30" class="trend-chart"></div></div>
    </div>
    <div class="chart-row">
      <div class="ab-panel">
        <h3>A/B 测试：信保纠纷处理 v2.0 vs v1.0</h3>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">运行中 \u00B7 第 5 天 / 共 7 天 \u00B7 流量 50:50</div>
        <div class="ab-compare">
          <div class="ab-group control">
            <h4>对照组 (旧版v1.0)</h4>
            <div class="ab-metric"><div class="label">CSAT</div><div class="val">4.1</div></div>
            <div class="ab-metric"><div class="label">FCR</div><div class="val">68%</div></div>
            <div class="ab-metric"><div class="label">AHT</div><div class="val">8.2 min</div></div>
          </div>
          <div class="ab-group experiment">
            <h4>实验组 (v2.0)</h4>
            <div class="ab-metric"><div class="label">CSAT</div><div class="val" style="color:var(--primary);">4.5</div></div>
            <div class="ab-metric"><div class="label">FCR</div><div class="val" style="color:var(--success);">82%</div></div>
            <div class="ab-metric"><div class="label">AHT</div><div class="val" style="color:var(--success);">5.6 min</div></div>
          </div>
        </div>
        <div style="text-align:center;margin-top:16px;">
          <span class="ab-delta positive">CSAT +0.4</span>
          <span class="ab-delta positive" style="margin-left:8px;">FCR +14%</span>
          <span class="ab-delta positive" style="margin-left:8px;">AHT -2.6min</span>
        </div>
        <div class="ab-status" style="text-align:center;color:var(--success);">实验组显著优于对照组（p=0.011），建议全量发布</div>
      </div>
      <div>
        <div class="chart-card" style="margin-bottom:16px;">
          <h3>告警列表</h3>
          <div class="alert-list" id="alertList">
            ${MOCK_ALERTS.map(a => `
              <div class="alert-item ${a.handled ? '' : 'alert-item-clickable'}" data-alert-id="${a.id}">
                <span class="alert-level ${a.level.toLowerCase()}">${a.level}</span>
                <span class="alert-msg">${a.msg}</span>
                <span class="alert-time">${a.time}</span>
                <span class="alert-status ${a.handled ? 'resolved' : 'open'}">${a.handled ? '已处理' : '未处理'}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="chart-card">
          <h3>\u{1F4CB} 最近活动</h3>
          <div class="activity-feed">
            ${MOCK_ACTIVITIES.map(act => `
              <div class="activity-item">
                <span class="activity-time">${act.time}</span>
                <span class="activity-user">${act.user}</span>
                <span class="activity-text">${act.action}</span>
                <span class="activity-target">${act.target}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('sec-monitor').innerHTML = html;

  // 跳转看板
  document.getElementById('monitorToKanban').addEventListener('click', () => {
    if (window.sscSwitchTab) window.sscSwitchTab('kanban');
  });

  // 告警点击交互
  document.querySelectorAll('.alert-item[data-alert-id]').forEach(item => {
    item.addEventListener('click', () => {
      const alertId = item.dataset.alertId;
      const alert = MOCK_ALERTS.find(a => a.id === alertId);
      if (!alert || alert.handled) return;

      // 检查是否已展开
      const existing = item.nextElementSibling;
      if (existing && existing.classList.contains('alert-detail-expand')) {
        existing.remove();
        return;
      }

      // 展开详情
      const detail = document.createElement('div');
      detail.className = 'alert-detail-expand';
      detail.innerHTML = `
        <div style="padding:10px 16px 12px;background:#FEFCE8;border-bottom:1px solid #FDE68A;font-size:12px;color:#92400E;">
          <div style="margin-bottom:8px;"><strong>告警详情：</strong>${alert.msg}</div>
          <div style="margin-bottom:8px;">级别：<strong>${alert.level}</strong> \u00B7 触发时间：${alert.time}</div>
          <button class="btn btn-primary" style="padding:4px 14px;font-size:11px;" data-handle-alert="${alertId}">\u2705 标记为已处理</button>
        </div>`;
      item.after(detail);

      detail.querySelector('[data-handle-alert]').addEventListener('click', (e) => {
        e.stopPropagation();
        alert.handled = true;
        renderMonitor();
        showToast(`告警 [${alert.level}] 已标记为已处理`);
      });
    });
  });

  // 渲染趋势图
  renderSingleTrend('csatTrend30', TREND_DATA.csat, TREND_DATA.dates, '#4F46E5', 'CSAT', 3.5, 5.0);
  renderSingleTrend('fcrTrend30', TREND_DATA.fcr, TREND_DATA.dates, '#059669', 'FCR%', 70, 100);
}
