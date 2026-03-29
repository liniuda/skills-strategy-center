/**
 * 看板模块（列表模式）
 * 关联：REAL_SKILLS.status 管理生命周期（草稿→审核→灰度→发布→归档）
 * 状态变更影响监控模块
 * 支持：搜索、状态筛选、分页、卡片点击查看 Skill 策略详情弹窗
 */
import { REAL_SKILLS, SUB_SCENARIO_DATA, ALL_CAPABILITIES } from '../data/skills.js';
import { showToast } from '../utils.js';

const STATUS_TABS = [
  { key: 'all', label: '\u5168\u90E8' },
  { key: 'draft', label: '\u{1F4DD} \u8349\u7A3F' },
  { key: 'review', label: '\u{1F50D} \u5BA1\u6838\u4E2D' },
  { key: 'canary', label: '\u{1F9EA} \u7070\u5EA6\u4E2D' },
  { key: 'published', label: '\u2705 \u5DF2\u53D1\u5E03' },
  { key: 'archived', label: '\u{1F4E6} \u5DF2\u5F52\u6863' },
];

const NEXT_ACTION = { draft: '\u63D0\u4EA4\u5BA1\u6838', review: '\u901A\u8FC7\u5BA1\u6838', canary: '\u5168\u91CF\u53D1\u5E03', published: '\u5F52\u6863', archived: '\u6062\u590D\u4E3A\u8349\u7A3F' };
const NEXT_STATUS = { draft: 'review', review: 'canary', canary: 'published', published: 'archived', archived: 'draft' };

const STATUS_LABELS = { draft: '\u8349\u7A3F', review: '\u5BA1\u6838\u4E2D', canary: '\u7070\u5EA6\u4E2D', published: '\u5DF2\u53D1\u5E03', archived: '\u5DF2\u5F52\u6863' };
const STATUS_COLORS = { draft: '#64748B', review: '#D97706', canary: '#7C3AED', published: '#059669', archived: '#9CA3AF' };

const PAGE_SIZE = 5;
let currentFilter = 'all';
let currentSearch = '';
let currentPage = 1;

function getFilteredSkills() {
  let list = [...REAL_SKILLS];
  if (currentFilter !== 'all') {
    list = list.filter(s => s.status === currentFilter);
  }
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      (s.subScenarios || []).some(sub => sub.toLowerCase().includes(q))
    );
  }
  return list;
}

export function renderKanban() {
  const filtered = getFilteredSkills();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const pageSkills = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 状态统计
  const statusCounts = {};
  REAL_SKILLS.forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

  // 状态筛选 tabs
  const tabsHtml = STATUS_TABS.map(t => {
    const count = t.key === 'all' ? REAL_SKILLS.length : (statusCounts[t.key] || 0);
    const active = currentFilter === t.key ? ' kanban-tab-active' : '';
    return `<button class="kanban-tab${active}" data-filter="${t.key}">${t.label}<span class="kanban-tab-count">${count}</span></button>`;
  }).join('');

  // 列表行
  const rowsHtml = pageSkills.length > 0
    ? pageSkills.map(s => {
      const statusLabel = STATUS_LABELS[s.status] || s.status;
      const statusColor = STATUS_COLORS[s.status] || '#64748B';
      const subCount = (s.subScenarios || []).length;
      const capCount = (s.capabilities || []).length;
      return `
        <div class="kanban-list-row" data-skill-id="${s.id}">
          <div class="kanban-list-cell kanban-list-name">
            <span class="kanban-list-icon">${s.icon}</span>
            <div>
              <div class="kanban-list-title">${s.name}</div>
              <div class="kanban-list-desc">${s.desc}</div>
            </div>
          </div>
          <div class="kanban-list-cell kanban-list-status">
            <span class="kanban-status-badge" style="background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}30;">${statusLabel}</span>
          </div>
          <div class="kanban-list-cell kanban-list-meta">
            <span title="\u7248\u672C">${s.version}</span>
          </div>
          <div class="kanban-list-cell kanban-list-meta">
            <span title="\u4F1A\u8BDD\u6570" style="color:${s.color};font-weight:500;">${s.primaryCount.toLocaleString()}</span>
          </div>
          <div class="kanban-list-cell kanban-list-meta">
            <span title="\u89C4\u5219\u6570">${s.ruleCount} \u6761</span>
          </div>
          <div class="kanban-list-cell kanban-list-meta">
            <span title="\u5B50\u573A\u666F">${subCount} \u4E2A</span>
          </div>
          <div class="kanban-list-cell kanban-list-meta">
            <span title="\u80FD\u529B">${capCount} \u9879</span>
          </div>
          <div class="kanban-list-cell kanban-list-actions">
            <button class="kanban-action-btn kanban-action-move" data-move-skill="${s.id}" data-move-to="${NEXT_STATUS[s.status]}" title="${NEXT_ACTION[s.status]}">${NEXT_ACTION[s.status]}</button>
            <button class="kanban-action-btn kanban-action-edit" data-edit-skill="${s.id}" title="\u7F16\u8F91\u7B56\u7565">\u{1F4DD}</button>
          </div>
        </div>`;
    }).join('')
    : `<div class="kanban-list-empty">\u{1F50D} \u672A\u627E\u5230\u5339\u914D\u7684\u7B56\u7565</div>`;

  // 分页
  let paginationHtml = '';
  if (totalPages > 1) {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      const active = i === currentPage ? ' kanban-page-active' : '';
      pages.push(`<button class="kanban-page-btn${active}" data-page="${i}">${i}</button>`);
    }
    paginationHtml = `
      <div class="kanban-pagination">
        <button class="kanban-page-btn" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? 'disabled' : ''}>\u2190</button>
        ${pages.join('')}
        <button class="kanban-page-btn" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? 'disabled' : ''}>\u2192</button>
        <span class="kanban-page-info">\u5171 ${filtered.length} \u6761\uFF0C${currentPage}/${totalPages} \u9875</span>
      </div>`;
  } else {
    paginationHtml = `<div class="kanban-pagination"><span class="kanban-page-info">\u5171 ${filtered.length} \u6761</span></div>`;
  }

  const html = `
    <h1 class="section-title">\u7B56\u7565\u770B\u677F</h1>
    <p class="section-desc">\u7BA1\u7406\u6240\u6709 Skill \u7B56\u7565\u7684\u751F\u547D\u5468\u671F\u72B6\u6001 <button class="module-nav-link" id="kanbanToMonitor">\u67E5\u770B\u76D1\u63A7\u6548\u679C \u2192</button></p>
    <div class="kanban-toolbar">
      <div class="kanban-tabs">${tabsHtml}</div>
      <div class="kanban-search-wrap">
        <input type="text" class="kanban-search" id="kanbanSearch" placeholder="\u641C\u7D22\u7B56\u7565\u540D\u79F0\u3001\u63CF\u8FF0\u6216\u5B50\u573A\u666F..." value="${escHtml(currentSearch)}">
      </div>
    </div>
    <div class="kanban-list">
      <div class="kanban-list-header">
        <div class="kanban-list-cell kanban-list-name">\u7B56\u7565\u540D\u79F0</div>
        <div class="kanban-list-cell kanban-list-status">\u72B6\u6001</div>
        <div class="kanban-list-cell kanban-list-meta">\u7248\u672C</div>
        <div class="kanban-list-cell kanban-list-meta">\u4F1A\u8BDD\u6570</div>
        <div class="kanban-list-cell kanban-list-meta">\u89C4\u5219</div>
        <div class="kanban-list-cell kanban-list-meta">\u5B50\u573A\u666F</div>
        <div class="kanban-list-cell kanban-list-meta">\u80FD\u529B</div>
        <div class="kanban-list-cell kanban-list-actions">\u64CD\u4F5C</div>
      </div>
      ${rowsHtml}
    </div>
    ${paginationHtml}`;

  document.getElementById('sec-kanban').innerHTML = html;

  // 绑定事件
  bindKanbanEvents();
}

function bindKanbanEvents() {
  // 跳转到监控
  document.getElementById('kanbanToMonitor').addEventListener('click', () => {
    if (window.sscSwitchTab) window.sscSwitchTab('monitor');
  });

  // 状态筛选
  document.querySelectorAll('.kanban-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      renderKanban();
    });
  });

  // 搜索
  const searchInput = document.getElementById('kanbanSearch');
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = searchInput.value;
      currentPage = 1;
      renderKanban();
      // 重新聚焦并恢复光标位置
      const newInput = document.getElementById('kanbanSearch');
      if (newInput) { newInput.focus(); newInput.setSelectionRange(newInput.value.length, newInput.value.length); }
    }, 300);
  });

  // 分页
  document.querySelectorAll('.kanban-page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      currentPage = parseInt(btn.dataset.page);
      renderKanban();
    });
  });

  // 行点击查看详情
  document.querySelectorAll('.kanban-list-row[data-skill-id]').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.kanban-action-btn')) return;
      showSkillDetail(row.dataset.skillId);
    });
  });

  // 状态流转按钮
  document.querySelectorAll('[data-move-skill]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveSkillStatus(btn.dataset.moveSkill, btn.dataset.moveTo);
    });
  });

  // 编辑按钮（直接跳转编辑器）
  document.querySelectorAll('[data-edit-skill]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const s = REAL_SKILLS.find(x => x.id === btn.dataset.editSkill);
      if (!s) return;
      const caps = (s.capabilities || []).map(cId => ALL_CAPABILITIES.find(c => c.id === cId)).filter(Boolean);
      if (window.sscState) {
        window.sscState.fromSkill = {
          id: s.id,
          name: s.name,
          icon: s.icon,
          desc: s.desc,
          status: s.status,
          version: s.version,
          ruleCount: s.ruleCount,
          subScenarios: s.subScenarios || [],
          capabilities: caps.map(c => c.name),
        };
      }
      if (window.sscSwitchTab) window.sscSwitchTab('editor');
    });
  });
}

function moveSkillStatus(id, newStatus) {
  const skill = REAL_SKILLS.find(s => s.id === id);
  if (!skill) return;
  skill.status = newStatus;
  renderKanban();
  showToast(`[${skill.name}] \u5DF2\u79FB\u81F3 ${STATUS_LABELS[newStatus] || newStatus}`);
}

/**
 * 显示 Skill 策略详情弹窗
 */
function showSkillDetail(skillId) {
  const s = REAL_SKILLS.find(x => x.id === skillId);
  if (!s) return;

  const modal = document.getElementById('skillModal');
  const subData = SUB_SCENARIO_DATA[skillId] || [];
  const caps = (s.capabilities || []).map(cId => ALL_CAPABILITIES.find(c => c.id === cId)).filter(Boolean);

  const statusLabel = STATUS_LABELS[s.status] || s.status;
  const statusColor = STATUS_COLORS[s.status] || '#64748B';

  // 子场景进度条
  const subHtml = subData.length > 0
    ? subData.map(d => `
      <div class="bar-item">
        <div class="bar-label">${d.name}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${d.pct * 2}%;background:${s.color};">${d.pct}%</div></div>
      </div>`).join('')
    : '<div style="color:var(--text-secondary);font-size:12px;">\u6682\u65E0\u5B50\u573A\u666F\u6570\u636E</div>';

  // 能力标签
  const capsHtml = caps.length > 0
    ? caps.map(c => `<span class="modal-tag" style="background:${s.color}15;color:${s.color};">${c.icon} ${c.name}</span>`).join(' ')
    : '<span style="color:var(--text-secondary);font-size:12px;">\u6682\u65E0\u80FD\u529B\u914D\u7F6E</span>';

  document.getElementById('skillModalContent').innerHTML = `
    <div class="modal-header">
      <h3>${s.icon} ${s.name}</h3>
      <button class="modal-close" id="closeSkillModal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-field" style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
        <span class="modal-tag" style="background:${statusColor}18;color:${statusColor};">${statusLabel}</span>
        <span class="modal-tag" style="background:#F1F5F9;color:var(--text-secondary);">${s.version}</span>
        <span style="font-size:12px;color:var(--text-secondary);">${s.primaryCount.toLocaleString()} \u4F1A\u8BDD \u00B7 ${s.ruleCount} \u6761\u89C4\u5219</span>
      </div>
      <div class="modal-field">
        <div class="field-label">\u7B56\u7565\u63CF\u8FF0</div>
        <div class="field-value">${s.desc}</div>
      </div>
      <div class="modal-field">
        <div class="field-label">\u5B50\u573A\u666F\u5206\u5E03 (${subData.length} \u4E2A\u5B50\u573A\u666F)</div>
        <div class="field-value"><div class="bar-chart">${subHtml}</div></div>
      </div>
      <div class="modal-field">
        <div class="field-label">\u8C03\u7528\u80FD\u529B (${caps.length} \u9879)</div>
        <div class="field-value">${capsHtml}</div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="closeSkillModalBtn">\u5173\u95ED</button>
      <button class="btn btn-primary" id="editSkillStrategy">\u{1F4DD} \u7F16\u8F91\u7B56\u7565</button>
    </div>`;
  modal.classList.add('show');

  document.getElementById('closeSkillModal').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('closeSkillModalBtn').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('editSkillStrategy').addEventListener('click', () => {
    modal.classList.remove('show');
    // 将 Skill 数据传入编辑器
    if (window.sscState) {
      window.sscState.fromSkill = {
        id: s.id,
        name: s.name,
        icon: s.icon,
        desc: s.desc,
        status: s.status,
        version: s.version,
        ruleCount: s.ruleCount,
        subScenarios: s.subScenarios || [],
        capabilities: caps.map(c => c.name),
      };
    }
    if (window.sscSwitchTab) window.sscSwitchTab('editor');
  });
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
