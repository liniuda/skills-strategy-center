/**
 * 看板模块（二级页面）
 * Level 1: Skill 文件夹概览（点击进入 Level 2）
 * Level 2: sk (子场景) 列表 — 编辑/迁移/状态变更
 */
import { REAL_SKILLS, SUB_SCENARIO_DATA, ALL_CAPABILITIES, moveSubScenario, getParentSkill } from '../data/skills.js';
import { showToast } from '../utils.js';

const STATUS_LABELS = { draft: '草稿', review: '审核中', canary: '灰度中', published: '已发布', archived: '已归档' };
const STATUS_COLORS = { draft: '#64748B', review: '#D97706', canary: '#7C3AED', published: '#059669', archived: '#9CA3AF' };
const NEXT_ACTION = { draft: '提交审核', review: '通过审核', canary: '全量发布', published: '归档', archived: '恢复为草稿' };
const NEXT_STATUS = { draft: 'review', review: 'canary', canary: 'published', published: 'archived', archived: 'draft' };

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'review', label: '审核中' },
  { key: 'canary', label: '灰度中' },
  { key: 'published', label: '已发布' },
  { key: 'archived', label: '已归档' },
];

const PAGE_SIZE = 8;

// ========== 路由状态 ==========
let currentSkillId = null;   // null=Level 1, string=Level 2
let skFilter = 'all';
let skSearch = '';
let skPage = 1;

// ========== 入口 ==========
export function renderKanban() {
  if (currentSkillId) {
    renderSkLevel(currentSkillId);
  } else {
    renderSkillLevel();
  }
}

// ================================================================
// Level 1: Skill 文件夹概览
// ================================================================
function renderSkillLevel() {
  const cards = REAL_SKILLS.map(s => {
    const skCount = (s.subScenarios || []).length;
    const capCount = (s.capabilities || []).length;
    const statusLabel = STATUS_LABELS[s.status] || s.status;
    const statusColor = STATUS_COLORS[s.status] || '#64748B';
    // 已发布 sk 占比
    const publishedSk = (s.subScenarios || []).filter(sk => sk.status === 'published').length;
    const pct = skCount > 0 ? Math.round(publishedSk / skCount * 100) : 0;
    return `
      <div class="kanban-folder-card" data-enter-skill="${s.id}" style="border-left-color:${s.color};">
        <div class="kanban-folder-top">
          <span class="kanban-folder-icon">${s.icon}</span>
          <div>
            <div class="kanban-folder-title">${s.name}</div>
            <div class="kanban-folder-desc">${s.desc}</div>
          </div>
        </div>
        <div class="kanban-folder-meta">
          <span class="kanban-folder-tag" style="background:${statusColor}15;color:${statusColor};">${statusLabel}</span>
          <span class="kanban-folder-tag" style="background:#F1F5F9;color:var(--text-secondary);">${s.version}</span>
          <span class="kanban-folder-tag" style="background:#F1F5F9;color:var(--text-secondary);">${skCount} 个子场景</span>
          <span class="kanban-folder-tag" style="background:#F1F5F9;color:var(--text-secondary);">${capCount} 项能力</span>
          <span class="kanban-folder-tag" style="background:#F1F5F9;color:var(--text-secondary);">${s.primaryCount.toLocaleString()} 会话</span>
        </div>
        <div class="kanban-folder-bar">
          <div class="kanban-folder-bar-fill" style="width:${pct}%;background:${s.color};"></div>
        </div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${publishedSk}/${skCount} 子场景已发布 (${pct}%)</div>
      </div>`;
  }).join('');

  const html = `
    <h1 class="section-title">策略看板</h1>
    <p class="section-desc">管理所有 Skill 及其子场景的生命周期 <button class="module-nav-link" id="kanbanToMonitor">查看监控效果 →</button></p>
    <div class="kanban-folder-grid">${cards}</div>`;

  document.getElementById('sec-kanban').innerHTML = html;

  // 绑定事件
  document.getElementById('kanbanToMonitor').addEventListener('click', () => {
    if (window.sscSwitchTab) window.sscSwitchTab('monitor');
  });
  document.querySelectorAll('[data-enter-skill]').forEach(card => {
    card.addEventListener('click', () => {
      currentSkillId = card.dataset.enterSkill;
      skFilter = 'all';
      skSearch = '';
      skPage = 1;
      renderKanban();
    });
  });
}

// ================================================================
// Level 2: sk 列表
// ================================================================
function renderSkLevel(skillId) {
  const skill = REAL_SKILLS.find(s => s.id === skillId);
  if (!skill) { currentSkillId = null; renderSkillLevel(); return; }

  const allSks = skill.subScenarios || [];

  // 筛选
  let filtered = [...allSks];
  if (skFilter !== 'all') {
    filtered = filtered.filter(sk => sk.status === skFilter);
  }
  if (skSearch.trim()) {
    const q = skSearch.trim().toLowerCase();
    filtered = filtered.filter(sk => sk.name.toLowerCase().includes(q));
  }

  // 分页
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (skPage > totalPages) skPage = totalPages;
  const pageSks = filtered.slice((skPage - 1) * PAGE_SIZE, skPage * PAGE_SIZE);

  // 状态统计
  const statusCounts = {};
  allSks.forEach(sk => { statusCounts[sk.status] = (statusCounts[sk.status] || 0) + 1; });

  // 面包屑
  const breadcrumbHtml = `
    <div class="kanban-breadcrumb">
      <button class="kanban-breadcrumb-link" id="kanbanBack">策略看板</button>
      <span class="kanban-breadcrumb-sep">›</span>
      <span class="kanban-breadcrumb-current">${skill.icon} ${skill.name}</span>
    </div>`;

  // 状态 tabs
  const tabsHtml = STATUS_TABS.map(t => {
    const count = t.key === 'all' ? allSks.length : (statusCounts[t.key] || 0);
    const active = skFilter === t.key ? ' kanban-tab-active' : '';
    return `<button class="kanban-tab${active}" data-sk-filter="${t.key}">${t.label}<span class="kanban-tab-count">${count}</span></button>`;
  }).join('');

  // sk 行
  const rowsHtml = pageSks.length > 0
    ? pageSks.map(sk => {
      const statusLabel = STATUS_LABELS[sk.status] || sk.status;
      const statusColor = STATUS_COLORS[sk.status] || '#64748B';
      const capCount = (sk.capabilities || []).length;
      return `
        <div class="kanban-list-row" data-sk-id="${sk.id}">
          <div class="kanban-list-cell kanban-list-name">
            <div>
              <div class="kanban-list-title">${sk.name}</div>
              <div class="kanban-list-desc">ID: ${sk.id}</div>
            </div>
          </div>
          <div class="kanban-list-cell kanban-list-status">
            <span class="kanban-status-badge" style="background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}30;">${statusLabel}</span>
          </div>
          <div class="kanban-list-cell kanban-list-meta">${sk.version}</div>
          <div class="kanban-list-cell kanban-list-meta" style="color:${skill.color};font-weight:500;">${sk.primaryCount.toLocaleString()}</div>
          <div class="kanban-list-cell kanban-list-meta">${sk.ruleCount} 条</div>
          <div class="kanban-list-cell kanban-list-meta">
            <div class="kanban-mini-bar"><div class="kanban-mini-bar-fill" style="width:${sk.primaryPct}%;background:${skill.color};"></div></div>
            <span style="font-size:11px;margin-left:4px;">${sk.primaryPct}%</span>
          </div>
          <div class="kanban-list-cell kanban-list-meta">${capCount} 项</div>
          <div class="kanban-list-cell kanban-sk-actions">
            <button class="kanban-sk-btn kanban-sk-btn-status" data-sk-move="${sk.id}" data-move-to="${NEXT_STATUS[sk.status]}" title="${NEXT_ACTION[sk.status]}">${NEXT_ACTION[sk.status]}</button>
            <button class="kanban-sk-btn kanban-sk-btn-edit" data-sk-edit="${sk.id}" title="编辑策略">编辑</button>
            <button class="kanban-sk-btn kanban-sk-btn-migrate" data-sk-migrate="${sk.id}" title="迁移到其他 Skill">迁移</button>
          </div>
        </div>`;
    }).join('')
    : '<div class="kanban-list-empty">未找到匹配的子场景</div>';

  // 分页
  let paginationHtml = '';
  if (totalPages > 1) {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      const active = i === skPage ? ' kanban-page-active' : '';
      pages.push(`<button class="kanban-page-btn${active}" data-sk-page="${i}">${i}</button>`);
    }
    paginationHtml = `
      <div class="kanban-pagination">
        <button class="kanban-page-btn" data-sk-page="${Math.max(1, skPage - 1)}" ${skPage === 1 ? 'disabled' : ''}>←</button>
        ${pages.join('')}
        <button class="kanban-page-btn" data-sk-page="${Math.min(totalPages, skPage + 1)}" ${skPage === totalPages ? 'disabled' : ''}>→</button>
        <span class="kanban-page-info">共 ${filtered.length} 条，${skPage}/${totalPages} 页</span>
      </div>`;
  } else {
    paginationHtml = `<div class="kanban-pagination"><span class="kanban-page-info">共 ${filtered.length} 条</span></div>`;
  }

  const html = `
    ${breadcrumbHtml}
    <h1 class="section-title">${skill.icon} ${skill.name} <span style="font-size:14px;font-weight:400;color:var(--text-secondary);">— 子场景管理</span></h1>
    <p class="section-desc">${skill.desc} · ${skill.version} · ${skill.primaryCount.toLocaleString()} 会话 · ${skill.ruleCount} 条规则</p>
    <div class="kanban-toolbar">
      <div class="kanban-tabs">${tabsHtml}</div>
      <div class="kanban-search-wrap">
        <input type="text" class="kanban-search" id="skSearch" placeholder="搜索子场景名称..." value="${escHtml(skSearch)}">
      </div>
    </div>
    <div class="kanban-list">
      <div class="kanban-list-header">
        <div class="kanban-list-cell kanban-list-name">子场景</div>
        <div class="kanban-list-cell kanban-list-status">状态</div>
        <div class="kanban-list-cell kanban-list-meta">版本</div>
        <div class="kanban-list-cell kanban-list-meta">会话数</div>
        <div class="kanban-list-cell kanban-list-meta">规则</div>
        <div class="kanban-list-cell kanban-list-meta">占比</div>
        <div class="kanban-list-cell kanban-list-meta">能力</div>
        <div class="kanban-list-cell kanban-sk-actions">操作</div>
      </div>
      ${rowsHtml}
    </div>
    ${paginationHtml}`;

  document.getElementById('sec-kanban').innerHTML = html;
  bindSkLevelEvents(skillId);
}

// ================================================================
// Level 2 事件绑定
// ================================================================
function bindSkLevelEvents(skillId) {
  // 返回 Level 1
  document.getElementById('kanbanBack').addEventListener('click', () => {
    currentSkillId = null;
    renderKanban();
  });

  // 状态筛选
  document.querySelectorAll('[data-sk-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      skFilter = btn.dataset.skFilter;
      skPage = 1;
      renderKanban();
    });
  });

  // 搜索
  const searchInput = document.getElementById('skSearch');
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      skSearch = searchInput.value;
      skPage = 1;
      renderKanban();
      const newInput = document.getElementById('skSearch');
      if (newInput) { newInput.focus(); newInput.setSelectionRange(newInput.value.length, newInput.value.length); }
    }, 300);
  });

  // 分页
  document.querySelectorAll('[data-sk-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      skPage = parseInt(btn.dataset.skPage);
      renderKanban();
    });
  });

  // sk 状态变更
  document.querySelectorAll('[data-sk-move]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const skId = btn.dataset.skMove;
      const newStatus = btn.dataset.moveTo;
      const skill = REAL_SKILLS.find(s => s.id === skillId);
      if (!skill) return;
      const sk = skill.subScenarios.find(s => s.id === skId);
      if (!sk) return;
      sk.status = newStatus;
      renderKanban();
      showToast(`[${sk.name}] 已移至 ${STATUS_LABELS[newStatus] || newStatus}`);
    });
  });

  // sk 编辑 → 跳转编辑器
  document.querySelectorAll('[data-sk-edit]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const skId = btn.dataset.skEdit;
      const skill = REAL_SKILLS.find(s => s.id === skillId);
      if (!skill) return;
      const sk = skill.subScenarios.find(s => s.id === skId);
      if (!sk) return;
      const caps = (sk.capabilities || []).map(cId => ALL_CAPABILITIES.find(c => c.id === cId)).filter(Boolean);
      if (window.sscState) {
        window.sscState.fromSk = {
          skId: sk.id,
          skName: sk.name,
          skillId: skill.id,
          skillName: skill.name,
          skillIcon: skill.icon,
          status: sk.status,
          version: sk.version,
          ruleCount: sk.ruleCount,
          capabilities: caps.map(c => c.name),
          primaryCount: sk.primaryCount,
          primaryPct: sk.primaryPct,
        };
      }
      if (window.sscSwitchTab) window.sscSwitchTab('editor');
    });
  });

  // sk 迁移 → 打开迁移弹窗
  document.querySelectorAll('[data-sk-migrate]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMigrateModal(btn.dataset.skMigrate, skillId);
    });
  });
}

// ================================================================
// 迁移弹窗
// ================================================================
function openMigrateModal(skId, sourceSkillId) {
  const sourceSkill = REAL_SKILLS.find(s => s.id === sourceSkillId);
  if (!sourceSkill) return;
  const sk = sourceSkill.subScenarios.find(s => s.id === skId);
  if (!sk) return;

  const modal = document.getElementById('migrateModal');
  const options = REAL_SKILLS
    .filter(s => s.id !== sourceSkillId)
    .map(s => `<option value="${s.id}">${s.icon} ${s.name} (${(s.subScenarios || []).length} 个子场景)</option>`)
    .join('');

  document.getElementById('migrateModalContent').innerHTML = `
    <div class="modal-header">
      <h3>迁移子场景</h3>
      <button class="modal-close" id="closeMigrateModal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="migrate-preview">
        将 <strong>${sk.name}</strong> 从 <strong>${sourceSkill.icon} ${sourceSkill.name}</strong> 迁移到目标 Skill。
        迁移后，该子场景的能力配置将跟随迁移到目标 Skill。
      </div>
      <div class="migrate-form">
        <div class="migrate-field" style="margin-top:16px;">
          <label>目标 Skill</label>
          <select class="migrate-select" id="migrateTarget">${options}</select>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="cancelMigrate">取消</button>
      <button class="btn btn-primary" id="confirmMigrate">确认迁移</button>
    </div>`;

  modal.classList.add('show');

  document.getElementById('closeMigrateModal').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('cancelMigrate').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('confirmMigrate').addEventListener('click', () => {
    const targetId = document.getElementById('migrateTarget').value;
    if (!targetId) { showToast('请选择目标 Skill', 'warning'); return; }
    const ok = moveSubScenario(skId, targetId);
    modal.classList.remove('show');
    if (ok) {
      const targetSkill = REAL_SKILLS.find(s => s.id === targetId);
      showToast(`[${sk.name}] 已迁移到 ${targetSkill ? targetSkill.name : targetId}`);
      // 如果源 Skill 没有 sk 了，返回 Level 1
      const src = REAL_SKILLS.find(s => s.id === sourceSkillId);
      if (!src || (src.subScenarios || []).length === 0) {
        currentSkillId = null;
      }
      renderKanban();
    } else {
      showToast('迁移失败', 'warning');
    }
  });
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
