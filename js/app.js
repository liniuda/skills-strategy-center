/**
 * Skills 策略中心 - 主应用入口
 * 负责 Tab 切换、全局状态管理、模块初始化
 *
 * 模块关联关系：
 * ┌─────────┐    ┌──────────┐    ┌──────────┐
 * │ 全景总览 │───>│ 场景分析  │<──>│ 案例库   │
 * └─────────┘    └──────────┘    └──┬───────┘
 *                                    │ 基于案例创建策略
 *                                    v
 * ┌─────────┐    ┌──────────┐    ┌──────────┐
 * │ 能力矩阵 │───>│  武器库   │    │ 策略编辑器│
 * └─────────┘    └──────────┘    └──┬───────┘
 *                                    │ 规则进入看板
 *                                    v
 * ┌─────────┐    ┌──────────┐
 * │  监控    │<───│   看板    │ (状态变更触发监控)
 * └─────────┘    └──────────┘
 */
import { renderHome } from './modules/home.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderCases } from './modules/cases.js';
import { renderEditor } from './modules/editor.js';
import { renderKanban } from './modules/kanban.js';
import { renderMatrix } from './modules/matrix.js';
import { renderMonitor } from './modules/monitor.js';
import { renderArsenal } from './modules/arsenal.js';
import { renderGraph } from './modules/graph.js';
import { requireAuth, renderUserMenu } from './auth.js';

// 全局状态
let selectedSkillId = 'logistics';

/**
 * Tab 切换
 */
function switchTab(tab, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('sec-' + tab).classList.add('active');
  if (btn) {
    btn.classList.add('active');
  } else {
    const b = document.querySelector('.nav-tab[data-tab="' + tab + '"]');
    if (b) b.classList.add('active');
  }
}

/**
 * Skill 选择回调 - 跳转到场景分析并选中指定 Skill
 */
function handleSkillClick(skillId) {
  selectedSkillId = skillId;
  switchTab('dashboard');
  renderDashboard(selectedSkillId, handleSkillSelect);
}

/**
 * 场景分析中 Skill 切换回调
 */
function handleSkillSelect(skillId) {
  selectedSkillId = skillId;
  renderDashboard(selectedSkillId, handleSkillSelect);
}

/**
 * 从案例库跳转到策略编辑器
 */
function handleCreateStrategy() {
  switchTab('editor');
}

/**
 * 初始化侧边栏交互
 */
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const menuBtn = document.getElementById('mobileMenuBtn');
  const backdrop = document.getElementById('sidebarBackdrop');

  // 恢复折叠状态
  if (localStorage.getItem('ssc_sidebar_collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
  }

  // 折叠/展开切换
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapsed');
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    localStorage.setItem('ssc_sidebar_collapsed', String(collapsed));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
  });

  // 移动端: 打开抽屉
  menuBtn.addEventListener('click', () => {
    document.body.classList.add('sidebar-open');
  });

  // 移动端: 关闭抽屉
  backdrop.addEventListener('click', () => {
    document.body.classList.remove('sidebar-open');
  });

  // 窗口变大时自动关闭抽屉
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      document.body.classList.remove('sidebar-open');
    }
  });
}

/**
 * 初始化应用
 */
document.addEventListener('DOMContentLoaded', () => {
  // 认证守卫 - 未登录跳转到 login.html
  requireAuth();

  // 初始化侧边栏
  initSidebar();

  // 渲染用户菜单
  renderUserMenu(document.getElementById('navUser'));

  // 绑定 Tab 切换
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      switchTab(this.dataset.tab, this);
      // 部分模块需要在切换时刷新
      const tabName = this.dataset.tab;
      if (tabName === 'dashboard') renderDashboard(selectedSkillId, handleSkillSelect);
      if (tabName === 'kanban') renderKanban();
      if (tabName === 'monitor') renderMonitor();
      if (tabName === 'arsenal') renderArsenal();
      if (tabName === 'graph') renderGraph();
      // 移动端: 切换 tab 后关闭抽屉
      if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-open');
      }
    });
  });

  // 渲染所有模块
  renderHome(handleSkillClick);
  renderDashboard(selectedSkillId, handleSkillSelect);
  renderCases(handleCreateStrategy);
  renderEditor();
  renderKanban();
  renderMatrix();
  renderMonitor();
  renderArsenal();
  renderGraph();
});
