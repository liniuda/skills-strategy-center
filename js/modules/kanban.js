/**
 * 看板模块
 * 关联：REAL_SKILLS.status 管理生命周期（草稿→审核→灰度→发布→归档）
 * 状态变更影响监控模块
 */
import { REAL_SKILLS } from '../data/skills.js';
import { showToast } from '../utils.js';

const COLUMNS = [
  { key: 'draft', label: '\u{1F4DD} 草稿', color: '#64748B' },
  { key: 'review', label: '\u{1F50D} 审核中', color: '#D97706' },
  { key: 'canary', label: '\u{1F9EA} 灰度中', color: '#7C3AED' },
  { key: 'published', label: '\u2705 已发布', color: '#059669' },
  { key: 'archived', label: '\u{1F4E6} 已归档', color: '#9CA3AF' },
];

const NEXT_ACTION = { draft: '提交审核', review: '通过审核', canary: '全量发布', published: '归档', archived: '恢复为草稿' };
const NEXT_STATUS = { draft: 'review', review: 'canary', canary: 'published', published: 'archived', archived: 'draft' };

export function renderKanban() {
  let html = `<h1 class="section-title">策略看板</h1><p class="section-desc">可视化管理所有 Skill 策略的生命周期状态 <button class="module-nav-link" id="kanbanToMonitor">查看监控效果 \u2192</button></p><div class="kanban-board" id="kanbanBoard">`;
  COLUMNS.forEach(col => {
    const cards = REAL_SKILLS.filter(s => s.status === col.key);
    html += `<div class="kanban-column"><div class="kanban-col-title">${col.label}<span class="kanban-col-count">${cards.length}</span></div>`;
    cards.forEach(s => {
      html += `<div class="kanban-card" id="card-${s.id}">
        <h4>${s.icon} ${s.name}</h4>
        <div class="desc">${s.desc}</div>
        <div class="meta"><span>${s.version}</span><span style="color:${s.color};">${s.primaryCount} 会话</span></div>
        <button class="status-btn" data-move-skill="${s.id}" data-move-to="${NEXT_STATUS[col.key]}">${NEXT_ACTION[col.key]} \u2192</button>
      </div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  document.getElementById('sec-kanban').innerHTML = html;

  // 跳转到监控
  document.getElementById('kanbanToMonitor').addEventListener('click', () => {
    if (window.sscSwitchTab) window.sscSwitchTab('monitor');
  });

  // 绑定状态流转按钮
  document.querySelectorAll('[data-move-skill]').forEach(btn => {
    btn.addEventListener('click', () => {
      moveSkillStatus(btn.dataset.moveSkill, btn.dataset.moveTo);
    });
  });
}

function moveSkillStatus(id, newStatus) {
  const skill = REAL_SKILLS.find(s => s.id === id);
  if (!skill) return;
  skill.status = newStatus;
  const card = document.getElementById('card-' + id);
  if (card) { card.style.opacity = '0'; card.style.transform = 'scale(0.8)'; }
  setTimeout(() => {
    renderKanban();
    showToast(`[${skill.name}] 已移至 ${newStatus}`);
  }, 300);
}
