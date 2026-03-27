/**
 * 武器库模块
 * 关联：扫描 REAL_SKILLS 缺失的 API/系统集成/数据源
 * ARSENAL_TASKS.relatedSkills 与 REAL_SKILLS 关联
 * 任务状态影响整体能力完备度
 */
import { ARSENAL_TASKS, ARSENAL_CAT_COLORS, ARSENAL_PRI_COLORS, ARSENAL_PRI_LABELS, ARSENAL_STATUS_LABELS } from '../data/arsenal.js';
import { getSkillInfo } from '../data/skills.js';
import { showToast } from '../utils.js';

export function renderArsenal() {
  const total = ARSENAL_TASKS.length;
  const missingCount = ARSENAL_TASKS.filter(t => t.status === 'missing').length;
  const partialCount = ARSENAL_TASKS.filter(t => t.status === 'partial').length;
  const availableCount = ARSENAL_TASKS.filter(t => t.status === 'available').length;
  const completionRate = Math.round((availableCount + partialCount * 0.5) / total * 100);
  const cats = ['API接口', '系统集成', '数据源', '自动化动作', '通知渠道'];
  const catData = cats.map(c => {
    const items = ARSENAL_TASKS.filter(t => t.category === c);
    return { name: c, total: items.length, missing: items.filter(t => t.status === 'missing').length, partial: items.filter(t => t.status === 'partial').length, available: items.filter(t => t.status === 'available').length };
  });
  const maxCat = Math.max(...catData.map(c => c.total));
  const pris = ['critical', 'high', 'medium', 'low'];
  const priData = pris.map(p => { const count = ARSENAL_TASKS.filter(t => t.priority === p).length; return { key: p, label: ARSENAL_PRI_LABELS[p], count }; });
  const maxPri = Math.max(...priData.map(p => p.count));

  let html = `
    <h1 class="section-title">\u2694\uFE0F 武器库</h1>
    <p class="section-desc">扫描已发布 Skills，识别缺失的执行动作与操作接口，以任务形式跟踪补齐进度</p>
    <div class="stats-grid">
      <div class="stat-card red"><div class="label">缺失项</div><div class="value">${missingCount}</div></div>
      <div class="stat-card amber"><div class="label">部分就绪</div><div class="value">${partialCount}</div></div>
      <div class="stat-card green"><div class="label">已就绪</div><div class="value">${availableCount}</div></div>
      <div class="stat-card purple"><div class="label">整体完成度</div><div class="value">${completionRate}%</div><div class="arsenal-progress"><div class="arsenal-progress-fill" style="width:${completionRate}%;background:var(--primary);"></div></div></div>
    </div>
    <div class="chart-row">
      <div class="chart-card">
        <h3>按能力类别分布</h3>
        <div class="bar-chart">${catData.map(c => {
          const clr = ARSENAL_CAT_COLORS[c.name] || '#6366F1';
          return `<div class="bar-item"><div class="bar-label">${c.name}</div><div class="bar-track"><div class="bar-fill" style="width:${c.total / maxCat * 100}%;background:${clr}">${c.total}</div></div><div class="bar-count" style="font-size:11px;color:var(--text-secondary);">${c.missing}缺/${c.partial}半/${c.available}齐</div></div>`;
        }).join('')}
        </div>
      </div>
      <div class="chart-card">
        <h3>按优先级分布</h3>
        <div class="bar-chart">${priData.map(p => {
          const clr = ARSENAL_PRI_COLORS[p.key];
          return `<div class="bar-item"><div class="bar-label">${p.label}</div><div class="bar-track"><div class="bar-fill" style="width:${p.count / maxPri * 100}%;background:${clr}">${p.count}</div></div><div class="bar-count">${p.count}</div></div>`;
        }).join('')}
        </div>
      </div>
    </div>
    <div class="filter-bar">
      <input type="text" id="arsenalSearch" placeholder="搜索任务名称、关联 Skill...">
      <select id="arsenalCategory"><option value="">全部类别</option>${cats.map(c => `<option>${c}</option>`).join('')}</select>
      <select id="arsenalStatus"><option value="">全部状态</option><option value="missing">缺失</option><option value="partial">部分就绪</option><option value="available">已就绪</option></select>
      <select id="arsenalPriority"><option value="">全部优先级</option>${pris.map(p => `<option value="${p}">${ARSENAL_PRI_LABELS[p]}</option>`).join('')}</select>
    </div>
    <div class="quest-grid" id="arsenalGrid"></div>`;
  document.getElementById('sec-arsenal').innerHTML = html;

  // 绑定筛选事件
  const doFilter = () => filterArsenal();
  document.getElementById('arsenalSearch').addEventListener('input', doFilter);
  document.getElementById('arsenalCategory').addEventListener('change', doFilter);
  document.getElementById('arsenalStatus').addEventListener('change', doFilter);
  document.getElementById('arsenalPriority').addEventListener('change', doFilter);
  filterArsenal();
}

function filterArsenal() {
  const q = (document.getElementById('arsenalSearch').value || '').toLowerCase();
  const cat = document.getElementById('arsenalCategory').value;
  const st = document.getElementById('arsenalStatus').value;
  const pri = document.getElementById('arsenalPriority').value;
  const priOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const stOrder = { missing: 0, partial: 1, available: 2 };

  let items = ARSENAL_TASKS.filter(t => {
    if (q && !t.name.toLowerCase().includes(q) && !t.desc.toLowerCase().includes(q) && !t.relatedSkills.some(sid => { const s = getSkillInfo(sid); return s && s.name.toLowerCase().includes(q); })) return false;
    if (cat && t.category !== cat) return false;
    if (st && t.status !== st) return false;
    if (pri && t.priority !== pri) return false;
    return true;
  });
  items.sort((a, b) => (priOrder[a.priority] - priOrder[b.priority]) || (stOrder[a.status] - stOrder[b.status]));

  const grid = document.getElementById('arsenalGrid');
  grid.innerHTML = items.map(t => {
    const catClr = ARSENAL_CAT_COLORS[t.category] || '#6366F1';
    const skillTags = t.relatedSkills.map(sid => { const s = getSkillInfo(sid); if (!s) return ''; return `<span class="quest-skill-tag" style="background:${s.color}15;color:${s.color}">${s.icon} ${s.name}</span>`; }).join('');
    return `<div class="quest-card pri-${t.priority}">
      <div class="quest-card-body">
        <div class="quest-badges">
          <span class="quest-category" style="background:${catClr}15;color:${catClr}">${t.categoryIcon} ${t.category}</span>
          <span class="quest-priority ${t.priority}">${ARSENAL_PRI_LABELS[t.priority]}</span>
          <span class="quest-status ${t.status}">${ARSENAL_STATUS_LABELS[t.status]}</span>
        </div>
        <h3>${t.name}</h3>
        <div class="desc">${t.desc}</div>
        <div class="quest-skills">${skillTags}</div>
        <button class="btn btn-secondary" style="padding:4px 10px;font-size:11px;" data-task-detail="${t.id}">查看详情</button>
      </div>
    </div>`;
  }).join('') || '<div class="empty-state" style="grid-column:1/-1;">未找到匹配的任务</div>';

  // 绑定详情按钮
  grid.querySelectorAll('[data-task-detail]').forEach(btn => {
    btn.addEventListener('click', () => showTaskDetail(btn.dataset.taskDetail));
  });
}

function showTaskDetail(id) {
  const t = ARSENAL_TASKS.find(x => x.id === id);
  if (!t) return;
  const catClr = ARSENAL_CAT_COLORS[t.category] || '#6366F1';
  const skillsHtml = t.relatedSkills.map(sid => { const s = getSkillInfo(sid); if (!s) return ''; return `<span class="modal-tag" style="background:${s.color}15;color:${s.color}">${s.icon} ${s.name} ${s.version}</span>`; }).join(' ');
  const actionLabel = t.status === 'missing' ? '标记为部分就绪' : t.status === 'partial' ? '标记为已就绪' : '已就绪';
  const actionDisabled = t.status === 'available' ? 'disabled' : '';

  const modal = document.getElementById('taskModal');
  document.getElementById('taskModalContent').innerHTML = `
    <div class="modal-header"><h3>任务详情</h3><button class="modal-close" id="closeTaskModal">&times;</button></div>
    <div class="modal-body">
      <div class="modal-field"><div class="field-label">任务名称</div><div class="field-value" style="font-weight:600;font-size:16px;">${t.name}</div></div>
      <div class="modal-field"><div class="field-label">能力类别</div><div class="field-value"><span class="quest-category" style="background:${catClr}15;color:${catClr}">${t.categoryIcon} ${t.category}</span></div></div>
      <div style="display:flex;gap:16px;margin-bottom:12px;">
        <div class="modal-field" style="flex:1;"><div class="field-label">当前状态</div><div class="field-value"><span class="quest-status ${t.status}">${ARSENAL_STATUS_LABELS[t.status]}</span></div></div>
        <div class="modal-field" style="flex:1;"><div class="field-label">优先级</div><div class="field-value"><span class="quest-priority ${t.priority}">${ARSENAL_PRI_LABELS[t.priority]}</span></div></div>
      </div>
      <div class="modal-field"><div class="field-label">详细描述</div><div class="field-value">${t.desc}</div></div>
      <div class="modal-field"><div class="field-label">影响分析</div><div class="conflict-alert" style="margin-bottom:0;">\u26A0\uFE0F ${t.impact}</div></div>
      <div class="modal-field"><div class="field-label">建议补齐方案</div><div class="conflict-ok">\u2705 ${t.solution}</div></div>
      <div class="modal-field"><div class="field-label">关联 Skills</div><div class="field-value">${skillsHtml || '无'}</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="closeTaskModalBtn">关闭</button>
      <button class="btn btn-primary" id="markProgressBtn" ${actionDisabled}>${actionLabel}</button>
    </div>`;
  modal.classList.add('show');

  document.getElementById('closeTaskModal').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('closeTaskModalBtn').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('markProgressBtn').addEventListener('click', () => markTaskProgress(id));
}

function markTaskProgress(id) {
  const t = ARSENAL_TASKS.find(x => x.id === id);
  if (!t) return;
  if (t.status === 'available') { showToast('该任务已就绪', 'warning'); document.getElementById('taskModal').classList.remove('show'); return; }
  const oldStatus = t.status;
  t.status = t.status === 'missing' ? 'partial' : 'available';
  document.getElementById('taskModal').classList.remove('show');
  renderArsenal();
  showToast(`[${t.name}] ${ARSENAL_STATUS_LABELS[oldStatus]} \u2192 ${ARSENAL_STATUS_LABELS[t.status]}`);
  // 更新导航栏 badge
  const badge = document.querySelector('.nav-tab[data-tab="arsenal"] .nav-badge');
  if (badge) badge.textContent = ARSENAL_TASKS.filter(x => x.status === 'missing').length;
}
