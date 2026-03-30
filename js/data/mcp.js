/**
 * MCP Server 配置数据层
 * 管理外部 MCP Server 连接信息、Tools 列表、Skill 关联
 */

/* ── 状态常量 ── */
export const MCP_STATUS_LABELS = { online: '在线', offline: '离线', unknown: '未知' };
export const MCP_STATUS_COLORS = { online: '#059669', offline: '#DC2626', unknown: '#9CA3AF' };

export const MCP_TOOL_CAT_COLORS = {
  '数据查询': '#4F46E5',
  '内容管理': '#7C3AED',
  '业务操作': '#D97706',
  '平台工具': '#059669',
  '浏览器':   '#0284C7',
  '其他':     '#64748B',
};

/* ── 预填充数据（基于用户 mcp.json 配置） ── */
export const MCP_SERVERS = [
  {
    id: 'aone-data',
    name: 'Aone 数据平台',
    icon: '\ud83d\udcca',
    command: 'npx',
    args: ['mcp-remote', 'https://mcp.alibaba-inc.com/aone-data/mcp'],
    endpoint: 'https://mcp.alibaba-inc.com/aone-data/mcp',
    description: 'Aone 平台离线数据查询服务，支持 ODPS SQL 语法查询开放数据表',
    status: 'online',
    tags: ['数据查询', '内部服务'],
    tools: [
      { name: 'execute_odps_sql', description: '使用 ODPS SQL 语法执行查询，返回前 100 条记录', category: '数据查询' },
      { name: 'get_aone_data', description: '带权限校验的 ODPS SQL 查询，自动检查用户表权限', category: '数据查询' },
      { name: 'get_aone_domain_list', description: '获取 Aone 所有域列表，按域筛选离线表', category: '数据查询' },
      { name: 'get_aone_tables_by_domain', description: '通过 domain 获取对应域的离线表列表', category: '数据查询' },
      { name: 'get_table_meta', description: '获取指定离线表的元数据（字段定义、分区信息）', category: '数据查询' },
    ],
    skillBindings: [
      { skillId: 'logistics', toolNames: ['get_aone_data', 'execute_odps_sql'], purpose: '物流运输数据分析增强' },
      { skillId: 'ta-order', toolNames: ['get_aone_data'], purpose: '信保订单数据查询' },
      { skillId: 'payment-fund', toolNames: ['execute_odps_sql'], purpose: '支付资金流水分析' },
    ],
  },
  {
    id: 'yuque',
    name: '语雀知识库',
    icon: '\ud83d\udcdd',
    command: 'npx',
    args: ['mcp-remote', 'https://mcp.alibaba-inc.com/yuque/mcp'],
    endpoint: 'https://mcp.alibaba-inc.com/yuque/mcp',
    description: '语雀文档与知识库接入，支持文档检索、目录获取和用户信息查询',
    status: 'online',
    tags: ['内容管理', '知识库'],
    tools: [
      { name: 'yuque_get_doc_detail', description: '根据语雀链接获取文档详情内容', category: '内容管理' },
      { name: 'yuque_get_repo_toc', description: '获取知识库目录结构（需 group_login/book_slug）', category: '内容管理' },
      { name: 'yuque_whoami', description: '展示当前语雀用户信息', category: '平台工具' },
    ],
    skillBindings: [
      { skillId: 'knowledge-search', toolNames: ['yuque_get_doc_detail', 'yuque_get_repo_toc'], purpose: '知识检索能力增强' },
    ],
  },
  {
    id: 'cco-merchant',
    name: 'CCO 商家服务',
    icon: '\ud83c\udfea',
    command: 'npx',
    args: ['mcp-remote', 'https://xp-mcp.pre-mw-mcp.alibaba-inc.com/mcp'],
    endpoint: 'https://xp-mcp.pre-mw-mcp.alibaba-inc.com/mcp',
    description: 'CCO 商家侧 MCP 服务，提供商家客服场景的业务操作与数据查询',
    status: 'offline',
    tags: ['业务操作', '商家服务'],
    tools: [
      { name: 'merchant_query', description: '商家信息与店铺数据查询', category: '业务操作' },
      { name: 'order_operation', description: '订单状态查询与操作', category: '业务操作' },
      { name: 'dispute_handler', description: '纠纷工单处理与流转', category: '业务操作' },
    ],
    skillBindings: [
      { skillId: 'xinbao-dispute', toolNames: ['dispute_handler', 'order_operation'], purpose: '信保纠纷处理自动化' },
      { skillId: 'refund-return', toolNames: ['order_operation'], purpose: '退款退货流程辅助' },
      { skillId: 'store-operation', toolNames: ['merchant_query'], purpose: '店铺运营数据查询' },
    ],
  },
];

/* ── 辅助函数 ── */

export function getServerById(id) {
  return MCP_SERVERS.find(s => s.id === id) || null;
}

export function getServerTools(serverId) {
  const s = getServerById(serverId);
  return s ? s.tools : [];
}

export function getServersForSkill(skillId) {
  return MCP_SERVERS.filter(s =>
    s.skillBindings.some(b => b.skillId === skillId)
  );
}

export function getSkillsForServer(serverId) {
  const s = getServerById(serverId);
  if (!s) return [];
  return s.skillBindings.map(b => b.skillId);
}

/** 生成标准 mcp.json 格式（仅含 command + args） */
export function generateMcpJson() {
  const mcpServers = {};
  MCP_SERVERS.forEach(s => {
    mcpServers[s.id] = { command: s.command, args: [...s.args] };
  });
  return { mcpServers };
}

/** 添加新 Server */
export function addServer(config) {
  const id = config.id || config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const server = {
    id,
    name: config.name || id,
    icon: config.icon || '\ud83d\udd0c',
    command: config.command || 'npx',
    args: config.args || [],
    endpoint: config.endpoint || '',
    description: config.description || '',
    status: config.status || 'unknown',
    tags: config.tags || [],
    tools: config.tools || [],
    skillBindings: config.skillBindings || [],
  };
  MCP_SERVERS.push(server);
  return server;
}

/** 更新 Server */
export function updateServer(id, updates) {
  const s = getServerById(id);
  if (!s) return null;
  Object.assign(s, updates);
  return s;
}

/** 删除 Server */
export function removeServer(id) {
  const idx = MCP_SERVERS.findIndex(s => s.id === id);
  if (idx === -1) return false;
  MCP_SERVERS.splice(idx, 1);
  return true;
}
