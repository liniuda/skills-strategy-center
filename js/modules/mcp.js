/**
 * MCP 服务配置管理模块
 * 可视化管理 MCP Server 连接、Tools 列表、Skill 关联
 */
import {
  MCP_SERVERS, MCP_STATUS_LABELS, MCP_STATUS_COLORS, MCP_TOOL_CAT_COLORS,
  getServerById, generateMcpJson, addServer, updateServer, removeServer,
} from '../data/mcp.js';
import { REAL_SKILLS } from '../data/skills.js';
import { showToast } from '../utils.js';

/* ── 模块状态 ── */
let mcpSearch = '';
let mcpStatusFilter = 'all';
let expandedServers = new Set();

/* ── 主渲染 ── */
export function renderMcp() {
  const container = document.getElementById('sec-mcp');
  if (!container) return;

  // 筛选
  let servers = MCP_SERVERS;
  if (mcpStatusFilter !== 'all') {
    servers = servers.filter(s => s.status === mcpStatusFilter);
  }
  if (mcpSearch) {
    const q = mcpSearch.toLowerCase();
    servers = servers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.endpoint.toLowerCase().includes(q) ||
      s.tools.some(t => t.name.toLowerCase().includes(q))
    );
  }

  // 统计
  const totalServers = MCP_SERVERS.length;
  const onlineCount = MCP_SERVERS.filter(s => s.status === 'online').length;
  const totalTools = MCP_SERVERS.reduce((a, s) => a + s.tools.length, 0);
  const boundSkills = new Set();
  MCP_SERVERS.forEach(s => s.skillBindings.forEach(b => boundSkills.add(b.skillId)));

  const jsonStr = JSON.stringify(generateMcpJson(), null, 2);

  let html = `
    <h1 class="section-title">MCP 服务配置</h1>
    <p class="section-desc">管理外部 MCP Server 连接，增强 Skill 执行能力 &mdash; Model Context Protocol</p>

    <div class="stats-grid">
      <div class="stat-card purple"><div class="label">已配置服务</div><div class="value">${totalServers}</div></div>
      <div class="stat-card green"><div class="label">在线服务</div><div class="value">${onlineCount}</div></div>
      <div class="stat-card amber"><div class="label">可用工具</div><div class="value">${totalTools}</div></div>
      <div class="stat-card red"><div class="label">Skill 关联</div><div class="value">${boundSkills.size}</div></div>
    </div>

    <!-- 筛选栏 -->
    <div class="mcp-filter-bar">
      <input class="mcp-search" id="mcpSearch" type="text" placeholder="搜索服务器、Endpoint 或工具名..." value="${mcpSearch}">
      <select class="mcp-status-select" id="mcpStatusFilter">
        <option value="all"${mcpStatusFilter === 'all' ? ' selected' : ''}>全部状态</option>
        <option value="online"${mcpStatusFilter === 'online' ? ' selected' : ''}>在线</option>
        <option value="offline"${mcpStatusFilter === 'offline' ? ' selected' : ''}>离线</option>
        <option value="unknown"${mcpStatusFilter === 'unknown' ? ' selected' : ''}>未知</option>
      </select>
      <button class="btn btn-primary mcp-add-btn" id="mcpAddBtn">+ 添加服务器</button>
    </div>

    <!-- Server 卡片网格 -->
    <div class="mcp-grid">
      ${servers.map(s => renderServerCard(s)).join('')}
      ${servers.length === 0 ? '<div class="mcp-empty">没有匹配的 MCP 服务</div>' : ''}
    </div>

    <!-- JSON 配置预览 -->
    <div class="mcp-json-section">
      <h3 class="mcp-json-title">JSON 配置预览</h3>
      <p class="mcp-json-desc">标准 mcp.json 格式，可直接用于 Qoder / Claude Desktop 等 MCP 客户端配置</p>
      <div class="mcp-json-preview"><pre><code>${escapeHtml(jsonStr)}</code></pre></div>
      <div class="mcp-json-actions">
        <button class="btn btn-secondary" id="mcpCopyJson">复制配置</button>
        <button class="btn btn-secondary" id="mcpDownloadJson">下载 mcp.json</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  bindMcpEvents(container);
}

/* ── 单张 Server 卡片 ── */
function renderServerCard(s) {
  const isExpanded = expandedServers.has(s.id);
  const statusColor = MCP_STATUS_COLORS[s.status] || '#9CA3AF';
  const statusLabel = MCP_STATUS_LABELS[s.status] || '未知';
  const skillInfos = s.skillBindings.map(b => {
    const sk = REAL_SKILLS.find(r => r.id === b.skillId);
    return sk ? { icon: sk.icon, name: sk.name, purpose: b.purpose } : null;
  }).filter(Boolean);

  return `
    <div class="mcp-server-card status-${s.status}" data-server-id="${s.id}">
      <div class="mcp-card-header">
        <span class="mcp-card-icon">${s.icon}</span>
        <div class="mcp-card-title-wrap">
          <span class="mcp-card-name">${s.name}</span>
          <span class="mcp-status-dot status-${s.status}" title="${statusLabel}"></span>
          <span class="mcp-status-text" style="color:${statusColor}">${statusLabel}</span>
        </div>
      </div>
      <p class="mcp-card-desc">${s.description}</p>
      <div class="mcp-endpoint">
        <code>${s.endpoint}</code>
        <button class="mcp-copy-ep" data-ep="${s.endpoint}" title="复制 Endpoint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
      <div class="mcp-tags">${s.tags.map(t => `<span class="mcp-tag">${t}</span>`).join('')}</div>

      <!-- 工具 -->
      <button class="mcp-tools-toggle" data-toggle-server="${s.id}">
        <svg class="mcp-toggle-arrow${isExpanded ? ' expanded' : ''}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        ${s.tools.length} 个工具
      </button>
      <div class="mcp-tool-list${isExpanded ? ' expanded' : ''}" id="tools-${s.id}">
        ${s.tools.map(t => `
          <div class="mcp-tool-item">
            <span class="mcp-tool-name">${t.name}</span>
            <span class="mcp-tool-cat" style="background:${MCP_TOOL_CAT_COLORS[t.category] || '#64748B'}15;color:${MCP_TOOL_CAT_COLORS[t.category] || '#64748B'}">${t.category}</span>
            <span class="mcp-tool-desc">${t.description}</span>
          </div>
        `).join('')}
      </div>

      <!-- Skill 关联 -->
      ${skillInfos.length ? `
        <div class="mcp-skill-bindings">
          <span class="mcp-binding-label">Skill 关联</span>
          ${skillInfos.map(sk => `<span class="mcp-skill-tag" title="${sk.purpose}">${sk.icon} ${sk.name}</span>`).join('')}
        </div>
      ` : ''}

      <!-- 操作 -->
      <div class="mcp-card-actions">
        <button class="btn btn-secondary btn-sm" data-edit-server="${s.id}">编辑</button>
        <button class="btn btn-secondary btn-sm mcp-btn-danger" data-delete-server="${s.id}">删除</button>
      </div>
    </div>
  `;
}

/* ── 添加/编辑 Modal ── */
function openMcpModal(serverId) {
  const modal = document.getElementById('mcpModal');
  const content = document.getElementById('mcpModalContent');
  if (!modal || !content) return;

  const isEdit = !!serverId;
  const s = isEdit ? getServerById(serverId) : null;

  content.innerHTML = `
    <div class="modal-header">
      <h3>${isEdit ? '编辑 MCP 服务器' : '添加 MCP 服务器'}</h3>
      <button class="modal-close" id="mcpModalClose">&times;</button>
    </div>
    <div class="modal-body">
      <div class="mcp-form">
        <label class="mcp-form-label">服务器名称</label>
        <input class="mcp-form-input" id="mcpFormName" type="text" placeholder="例如：Aone 数据平台" value="${s ? s.name : ''}">

        <label class="mcp-form-label">图标</label>
        <select class="mcp-form-input" id="mcpFormIcon">
          ${['📊','📝','🏪','🔌','🔍','🛠️','📡','🌐','🤖','💾'].map(e =>
            `<option value="${e}"${s && s.icon === e ? ' selected' : ''}>${e}</option>`
          ).join('')}
        </select>

        <label class="mcp-form-label">启动命令</label>
        <input class="mcp-form-input" id="mcpFormCommand" type="text" placeholder="npx" value="${s ? s.command : 'npx'}">

        <label class="mcp-form-label">参数（每行一个）</label>
        <textarea class="mcp-form-textarea" id="mcpFormArgs" rows="3" placeholder="mcp-remote\nhttps://example.com/mcp">${s ? s.args.join('\n') : 'mcp-remote\n'}</textarea>

        <label class="mcp-form-label">Endpoint URL</label>
        <input class="mcp-form-input" id="mcpFormEndpoint" type="text" placeholder="https://example.com/mcp" value="${s ? s.endpoint : ''}">

        <label class="mcp-form-label">描述</label>
        <textarea class="mcp-form-textarea" id="mcpFormDesc" rows="2" placeholder="服务描述...">${s ? s.description : ''}</textarea>

        <label class="mcp-form-label">初始状态</label>
        <select class="mcp-form-input" id="mcpFormStatus">
          <option value="online"${s && s.status === 'online' ? ' selected' : ''}>在线</option>
          <option value="offline"${s && s.status === 'offline' ? ' selected' : ''}>离线</option>
          <option value="unknown"${!s || s.status === 'unknown' ? ' selected' : ''}>未知</option>
        </select>

        <label class="mcp-form-label">标签（逗号分隔）</label>
        <input class="mcp-form-input" id="mcpFormTags" type="text" placeholder="数据查询, 内部服务" value="${s ? s.tags.join(', ') : ''}">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="mcpModalCancel">取消</button>
      <button class="btn btn-primary" id="mcpModalSave" data-edit-id="${isEdit ? serverId : ''}">${isEdit ? '保存' : '添加'}</button>
    </div>
  `;

  modal.classList.add('active');

  // 事件
  const close = () => modal.classList.remove('active');
  content.querySelector('#mcpModalClose').addEventListener('click', close);
  content.querySelector('#mcpModalCancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  content.querySelector('#mcpModalSave').addEventListener('click', () => {
    const name = content.querySelector('#mcpFormName').value.trim();
    if (!name) { showToast('请填写服务器名称', 'error'); return; }

    const config = {
      name,
      icon: content.querySelector('#mcpFormIcon').value,
      command: content.querySelector('#mcpFormCommand').value.trim() || 'npx',
      args: content.querySelector('#mcpFormArgs').value.split('\n').map(l => l.trim()).filter(Boolean),
      endpoint: content.querySelector('#mcpFormEndpoint').value.trim(),
      description: content.querySelector('#mcpFormDesc').value.trim(),
      status: content.querySelector('#mcpFormStatus').value,
      tags: content.querySelector('#mcpFormTags').value.split(/[,，]/).map(t => t.trim()).filter(Boolean),
    };

    if (isEdit) {
      updateServer(serverId, config);
      showToast('服务器已更新');
    } else {
      addServer(config);
      showToast('服务器已添加');
    }
    close();
    renderMcp();
  });
}

/* ── 事件绑定 ── */
function bindMcpEvents(container) {
  // 搜索
  const searchEl = container.querySelector('#mcpSearch');
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      mcpSearch = searchEl.value;
      renderMcp();
    });
  }

  // 状态筛选
  const filterEl = container.querySelector('#mcpStatusFilter');
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      mcpStatusFilter = filterEl.value;
      renderMcp();
    });
  }

  // 添加
  const addBtn = container.querySelector('#mcpAddBtn');
  if (addBtn) addBtn.addEventListener('click', () => openMcpModal(null));

  // 展开/折叠工具列表
  container.querySelectorAll('[data-toggle-server]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.toggleServer;
      if (expandedServers.has(sid)) expandedServers.delete(sid);
      else expandedServers.add(sid);
      renderMcp();
    });
  });

  // 复制 Endpoint
  container.querySelectorAll('.mcp-copy-ep').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      navigator.clipboard.writeText(btn.dataset.ep).then(() => showToast('Endpoint 已复制'));
    });
  });

  // 编辑
  container.querySelectorAll('[data-edit-server]').forEach(btn => {
    btn.addEventListener('click', () => openMcpModal(btn.dataset.editServer));
  });

  // 删除
  container.querySelectorAll('[data-delete-server]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.deleteServer;
      const s = getServerById(sid);
      if (!s) return;
      if (!confirm(`确定删除「${s.name}」服务器？`)) return;
      removeServer(sid);
      expandedServers.delete(sid);
      showToast('服务器已删除');
      renderMcp();
    });
  });

  // 复制 JSON
  const copyBtn = container.querySelector('#mcpCopyJson');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const json = JSON.stringify(generateMcpJson(), null, 2);
      navigator.clipboard.writeText(json).then(() => showToast('配置已复制到剪贴板'));
    });
  }

  // 下载 JSON
  const dlBtn = container.querySelector('#mcpDownloadJson');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      const json = JSON.stringify(generateMcpJson(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mcp.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('mcp.json 已下载');
    });
  }
}

/* ── 工具函数 ── */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
