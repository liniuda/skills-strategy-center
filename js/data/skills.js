/**
 * Skills 核心数据 - 11大技能场景
 * 这是整个平台的核心数据源，串联所有模块
 * subScenarios 为独立 sk 对象数组，每个 sk 有独立的 id/状态/版本/规则/能力/会话数据
 */

// ========== 辅助：根据父 Skill 和 SUB_SCENARIO_DATA 生成 sk 对象 ==========
function buildSubScenarios(skillId, parentStatus, parentVersion, parentRuleCount, parentPrimaryCount, parentCapabilities, subData) {
  if (!subData || subData.length === 0) return [];
  const baseRule = Math.floor(parentRuleCount / subData.length);
  const remainder = parentRuleCount % subData.length;
  return subData.map((d, i) => ({
    id: skillId + '--' + d.name,
    name: d.name,
    status: parentStatus,
    version: parentVersion,
    ruleCount: baseRule + (i === subData.length - 1 ? remainder : 0),
    capabilities: [...parentCapabilities],
    primaryCount: Math.round(parentPrimaryCount * d.pct / 100),
    primaryPct: d.pct,
  }));
}

// ========== SUB_SCENARIO_DATA (保留，供图表模块使用) ==========
export const SUB_SCENARIO_DATA = {
  'logistics': [
    { name: '发货与物流关联', pct: 25 }, { name: '物流跟踪与查询', pct: 20 },
    { name: '清关与海关', pct: 15 }, { name: '揽收与仓库', pct: 12 },
    { name: '物流费用', pct: 12 }, { name: '异常与赔付', pct: 10 }, { name: '运单管理', pct: 6 }
  ],
  'account-permission': [
    { name: '账号登录与安全', pct: 22 }, { name: '子账号管理', pct: 18 },
    { name: '权限设置', pct: 18 }, { name: '认证与资质', pct: 16 },
    { name: '主账号操作', pct: 15 }, { name: '账号迁移与注销', pct: 11 }
  ],
  'payment-fund': [
    { name: '提现与结算', pct: 24 }, { name: '交易手续费', pct: 20 },
    { name: '资金冻结与解冻', pct: 18 }, { name: '支付方式管理', pct: 15 },
    { name: '退款资金流向', pct: 13 }, { name: '账单与对账', pct: 10 }
  ],
  'ip-compliance': [
    { name: '商标侵权处理', pct: 22 }, { name: '知识产权申诉', pct: 20 },
    { name: '平台合规检查', pct: 18 }, { name: '认证证书管理', pct: 16 },
    { name: '国别管控', pct: 14 }, { name: '违规处罚申诉', pct: 10 }
  ],
  'product-management': [
    { name: '商品发布与编辑', pct: 25 }, { name: '商品审核与违规', pct: 22 },
    { name: '商品管控与下架', pct: 18 }, { name: '批量管理', pct: 14 },
    { name: '类目与属性', pct: 12 }, { name: '商品优化建议', pct: 9 }
  ],
  'ta-order': [
    { name: '订单创建与起草', pct: 22 }, { name: '订单状态查询', pct: 20 },
    { name: '发货与物流关联', pct: 18 }, { name: '订单修改与取消', pct: 16 },
    { name: '合同与文档', pct: 14 }, { name: '订单确认收货', pct: 10 }
  ],
  'store-operation': [
    { name: '店铺装修', pct: 22 }, { name: '数据分析', pct: 20 },
    { name: '询盘管理', pct: 18 }, { name: '服务续费', pct: 16 },
    { name: '评价管理', pct: 14 }, { name: '运营工具', pct: 10 }
  ],
  'refund-return': [
    { name: '买家申请退款', pct: 30 }, { name: '卖家主动退款', pct: 22 },
    { name: '退货与物流', pct: 20 }, { name: '退款金额争议', pct: 16 }, { name: '无忧退货', pct: 12 }
  ],
  'xinbao-dispute': [
    { name: '退款协商', pct: 18 }, { name: '加急催促', pct: 16 },
    { name: '清关责任判定', pct: 12 }, { name: '举证操作', pct: 12 },
    { name: '仲裁流程', pct: 10 }, { name: '卖家主动退款', pct: 8 },
    { name: '退款操作失误', pct: 7 }, { name: 'PO BOX地址', pct: 7 },
    { name: '半托管退款', pct: 5 }, { name: '税费问题', pct: 5 }
  ],
  'semi-managed': [
    { name: '半托管发货', pct: 28 }, { name: '订单管理', pct: 24 },
    { name: '退款与纠纷', pct: 22 }, { name: '费用与计费', pct: 14 }, { name: '地址与清关', pct: 12 }
  ],
  'knowledge-search': [
    { name: '向量语义检索', pct: 30 }, { name: '知识库问答', pct: 25 },
    { name: '多语言检索', pct: 20 }, { name: '类目知识召回', pct: 15 }, { name: '帮助中心查询', pct: 10 }
  ],
};

// ========== REAL_SKILLS ==========
export const REAL_SKILLS = [
  {
    id: 'logistics', name: '物流运输', icon: '\u{1F69A}', color: '#3B82F6',
    primaryCount: 1503, primaryPct: 39.6, multiCount: 1894, multiPct: 49.9,
    subScenarios: buildSubScenarios('logistics', 'published', 'v1.0.0', 56, 1503,
      ['QUERY_LOGISTICS', 'TRANSFER_CARRIER', 'CREATE_TICKET', 'QUERY_ORDER', 'SEND_BUYER_EMAIL', 'TRANSFER_WAREHOUSE', 'TRANSFER_PLATFORM'],
      SUB_SCENARIO_DATA['logistics']),
    ruleCount: 56,
    capabilities: ['QUERY_LOGISTICS', 'TRANSFER_CARRIER', 'CREATE_TICKET', 'QUERY_ORDER', 'SEND_BUYER_EMAIL', 'TRANSFER_WAREHOUSE', 'TRANSFER_PLATFORM'],
    status: 'published', version: 'v1.0.0',
    desc: '覆盖发货/跟踪/清关/揽收/费用/异常/运单7大子场景'
  },
  {
    id: 'account-permission', name: '账号与权限', icon: '\u{1F510}', color: '#8B5CF6',
    primaryCount: 301, primaryPct: 7.9, multiCount: 743, multiPct: 19.6,
    subScenarios: buildSubScenarios('account-permission', 'published', 'v1.0.0', 13, 301,
      ['QUERY_ACCOUNT', 'MODIFY_ACCOUNT', 'CREATE_TICKET', 'CONTACT_AM'],
      SUB_SCENARIO_DATA['account-permission']),
    ruleCount: 13,
    capabilities: ['QUERY_ACCOUNT', 'MODIFY_ACCOUNT', 'CREATE_TICKET', 'CONTACT_AM'],
    status: 'published', version: 'v1.0.0',
    desc: '账号安全/子账号/权限/认证/迁移6大子场景'
  },
  {
    id: 'payment-fund', name: '支付与资金', icon: '\u{1F4B0}', color: '#059669',
    primaryCount: 291, primaryPct: 7.7, multiCount: 647, multiPct: 17.1,
    subScenarios: buildSubScenarios('payment-fund', 'published', 'v1.0.0', 13, 291,
      ['QUERY_FUND', 'CREATE_TICKET', 'QUERY_ORDER', 'CONTACT_PARTNER'],
      SUB_SCENARIO_DATA['payment-fund']),
    ruleCount: 13,
    capabilities: ['QUERY_FUND', 'CREATE_TICKET', 'QUERY_ORDER', 'CONTACT_PARTNER'],
    status: 'published', version: 'v1.0.0',
    desc: '提现/手续费/冻结/支付/退款/账单6大子场景'
  },
  {
    id: 'ip-compliance', name: '知识产权与合规', icon: '\u2696\uFE0F', color: '#D97706',
    primaryCount: 264, primaryPct: 7.0, multiCount: 470, multiPct: 12.4,
    subScenarios: buildSubScenarios('ip-compliance', 'published', 'v1.0.0', 14, 264,
      ['QUERY_PRODUCT', 'QUERY_COMPLIANCE', 'APPEAL_VIOLATION', 'CREATE_TICKET'],
      SUB_SCENARIO_DATA['ip-compliance']),
    ruleCount: 14,
    capabilities: ['QUERY_PRODUCT', 'QUERY_COMPLIANCE', 'APPEAL_VIOLATION', 'CREATE_TICKET'],
    status: 'published', version: 'v1.0.0',
    desc: '商标/申诉/合规/认证/管控/处罚6大子场景'
  },
  {
    id: 'product-management', name: '产品发布与管理', icon: '\u{1F4E6}', color: '#EC4899',
    primaryCount: 243, primaryPct: 6.4, multiCount: 451, multiPct: 11.9,
    subScenarios: buildSubScenarios('product-management', 'published', 'v1.0.0', 18, 243,
      ['QUERY_PRODUCT', 'CREATE_TICKET'],
      SUB_SCENARIO_DATA['product-management']),
    ruleCount: 18,
    capabilities: ['QUERY_PRODUCT', 'CREATE_TICKET'],
    status: 'published', version: 'v1.0.0',
    desc: '发布/审核/管控/批量/类目/优化6大子场景'
  },
  {
    id: 'ta-order', name: '信保订单管理', icon: '\u{1F4CB}', color: '#0EA5E9',
    primaryCount: 217, primaryPct: 5.7, multiCount: 934, multiPct: 24.6,
    subScenarios: buildSubScenarios('ta-order', 'published', 'v1.0.0', 16, 217,
      ['QUERY_ORDER', 'CREATE_TICKET', 'SEND_BUYER_EMAIL'],
      SUB_SCENARIO_DATA['ta-order']),
    ruleCount: 16,
    capabilities: ['QUERY_ORDER', 'CREATE_TICKET', 'SEND_BUYER_EMAIL'],
    status: 'published', version: 'v1.0.0',
    desc: '创建/查询/发货/修改/合同/收货6大子场景'
  },
  {
    id: 'store-operation', name: '店铺运营与装修', icon: '\u{1F3EA}', color: '#F59E0B',
    primaryCount: 215, primaryPct: 5.7, multiCount: 509, multiPct: 13.4,
    subScenarios: buildSubScenarios('store-operation', 'published', 'v1.0.0', 8, 215,
      ['QUERY_STORE', 'CREATE_TICKET'],
      SUB_SCENARIO_DATA['store-operation']),
    ruleCount: 8,
    capabilities: ['QUERY_STORE', 'CREATE_TICKET'],
    status: 'published', version: 'v1.0.0',
    desc: '装修/数据/询盘/续费/评价/工具6大子场景'
  },
  {
    id: 'refund-return', name: '退款与退货', icon: '\u{1F504}', color: '#DC2626',
    primaryCount: 151, primaryPct: 4.0, multiCount: 452, multiPct: 11.9,
    subScenarios: buildSubScenarios('refund-return', 'review', 'v1.0.0', 15, 151,
      ['QUERY_ORDER', 'QUERY_DISPUTE', 'CREATE_TICKET', 'SEND_BUYER_EMAIL'],
      SUB_SCENARIO_DATA['refund-return']),
    ruleCount: 15,
    capabilities: ['QUERY_ORDER', 'QUERY_DISPUTE', 'CREATE_TICKET', 'SEND_BUYER_EMAIL'],
    status: 'review', version: 'v1.0.0',
    desc: '买家退款/卖家退款/退货/争议/无忧5大子场景'
  },
  {
    id: 'xinbao-dispute', name: '信保纠纷处理', icon: '\u{1F6E1}\uFE0F', color: '#7C3AED',
    primaryCount: 84, primaryPct: 2.2, multiCount: 239, multiPct: 6.3,
    subScenarios: buildSubScenarios('xinbao-dispute', 'canary', 'v2.0.0', 33, 84,
      ['QUERY_DISPUTE', 'CREATE_URGENT_TICKET', 'SUBMIT_EVIDENCE', 'QUERY_REFUND_PROGRESS', 'SEND_BUYER_EMAIL', 'QUERY_ORDER', 'QUERY_LOGISTICS', 'TRANSFER_SPECIALIST'],
      SUB_SCENARIO_DATA['xinbao-dispute']),
    ruleCount: 33,
    capabilities: ['QUERY_DISPUTE', 'CREATE_URGENT_TICKET', 'SUBMIT_EVIDENCE', 'QUERY_REFUND_PROGRESS', 'SEND_BUYER_EMAIL', 'QUERY_ORDER', 'QUERY_LOGISTICS', 'TRANSFER_SPECIALIST'],
    status: 'canary', version: 'v2.0.0',
    desc: '退款/催促/清关/举证/仲裁等10大子场景'
  },
  {
    id: 'semi-managed', name: '半托管/全托管', icon: '\u{1F500}', color: '#14B8A6',
    primaryCount: 64, primaryPct: 1.7, multiCount: 252, multiPct: 6.6,
    subScenarios: buildSubScenarios('semi-managed', 'published', 'v1.0.0', 11, 64,
      ['QUERY_LOGISTICS', 'CREATE_TICKET', 'TRANSFER_CARRIER'],
      SUB_SCENARIO_DATA['semi-managed']),
    ruleCount: 11,
    capabilities: ['QUERY_LOGISTICS', 'CREATE_TICKET', 'TRANSFER_CARRIER'],
    status: 'published', version: 'v1.0.0',
    desc: '发货/订单/退款/费用/地址5大子场景'
  },
  {
    id: 'knowledge-search', name: '通用知识检索', icon: '\u{1F4DA}', color: '#6366F1',
    primaryCount: 0, primaryPct: 0, multiCount: 0, multiPct: 0,
    subScenarios: buildSubScenarios('knowledge-search', 'draft', 'v0.1.0', 5, 0,
      ['SEARCH_KNOWLEDGE'],
      SUB_SCENARIO_DATA['knowledge-search']),
    ruleCount: 5,
    capabilities: ['SEARCH_KNOWLEDGE'],
    status: 'draft', version: 'v0.1.0',
    desc: '基于BotSearchProxyService的向量检索知识召回能力，支持多语言/多终端/多应用场景',
    apiInfo: {
      interface: 'com.alibaba.xspace.china.solution.icbu.service.BotSearchProxyService#searchChunk',
      hsfVersion: '1.0.0',
      pom: { groupId: 'com.alibaba.xspace.china.solution.icbu', artifactId: 'china-solution-icbu-api', version: '1.10.27' },
      params: {
        score: { type: 'number', desc: '相似度阈值 0~1', default: 0.0 },
        categoryIds: { type: 'string[]', desc: '类目ID列表' },
        application: { type: 'enum', desc: '应用领域', values: ['ROBOT', 'HELP_CENTER', 'XP_ASSISTANT'] },
        query: { type: 'string', desc: '检索关键词' },
        tenantId: { type: 'number', desc: '租户ID' },
        channel: { type: 'enum', desc: '终端', values: ['IOS', 'ANDROID', 'PC', 'MSITE', 'HOTLINE'] },
        limit: { type: 'number', desc: '返回条目数', default: 10 },
        language: { type: 'enum', desc: '语言', values: ['zh_CN', 'en_US', 'ru_RU', 'ja_JP', 'nl_NL', 'pt_BR', 'ko_KR', 'ar_SA', 'de_DE', 'es_ES', 'fr_FR', 'it_IT', 'pl_PL', 'vi_VN', 'uk_UA', 'id_ID', 'ms_MY', 'th_TH'] },
      },
      response: {
        content: '知识内容整合文本',
        knowledgeItems: '知识条目列表(score/docId/bCode/kCode/title/content)',
      },
    },
  },
];

/**
 * 系统能力列表 - 与 REAL_SKILLS 通过 skills[] 关联
 * 用于能力矩阵模块的交叉分析
 */
export const ALL_CAPABILITIES = [
  { id: 'CREATE_TICKET', name: '创建工单', icon: '\u{1F4DD}', skills: ['logistics', 'account-permission', 'payment-fund', 'ip-compliance', 'product-management', 'ta-order', 'store-operation', 'refund-return', 'semi-managed'] },
  { id: 'QUERY_ORDER', name: '查询信保订单', icon: '\u{1F50D}', skills: ['logistics', 'payment-fund', 'ta-order', 'refund-return', 'xinbao-dispute'] },
  { id: 'SEND_BUYER_EMAIL', name: '联系买家', icon: '\u{1F4E7}', skills: ['logistics', 'ta-order', 'refund-return', 'xinbao-dispute'] },
  { id: 'QUERY_LOGISTICS', name: '查询物流状态', icon: '\u{1F69A}', skills: ['logistics', 'xinbao-dispute', 'semi-managed'] },
  { id: 'QUERY_PRODUCT', name: '查询商品状态', icon: '\u{1F4E6}', skills: ['ip-compliance', 'product-management'] },
  { id: 'QUERY_DISPUTE', name: '查询纠纷详情', icon: '\u2696\uFE0F', skills: ['refund-return', 'xinbao-dispute'] },
  { id: 'TRANSFER_CARRIER', name: '转接承运商', icon: '\u{1F4DE}', skills: ['logistics', 'semi-managed'] },
  { id: 'TRANSFER_WAREHOUSE', name: '转接仓库客服', icon: '\u{1F3ED}', skills: ['logistics'] },
  { id: 'TRANSFER_PLATFORM', name: '转接平台客服', icon: '\u{1F517}', skills: ['logistics'] },
  { id: 'QUERY_ACCOUNT', name: '查询账号信息', icon: '\u{1F464}', skills: ['account-permission'] },
  { id: 'MODIFY_ACCOUNT', name: '修改账号设置', icon: '\u2699\uFE0F', skills: ['account-permission'] },
  { id: 'CONTACT_AM', name: '联系客户经理', icon: '\u{1F4BC}', skills: ['account-permission'] },
  { id: 'QUERY_FUND', name: '查询资金状态', icon: '\u{1F4B0}', skills: ['payment-fund'] },
  { id: 'CONTACT_PARTNER', name: '联系拍档', icon: '\u{1F91D}', skills: ['payment-fund'] },
  { id: 'QUERY_COMPLIANCE', name: '查询合规状态', icon: '\u{1F4CB}', skills: ['ip-compliance'] },
  { id: 'APPEAL_VIOLATION', name: '提交违规申诉', icon: '\u{1F4E4}', skills: ['ip-compliance'] },
  { id: 'QUERY_STORE', name: '查询店铺数据', icon: '\u{1F3EA}', skills: ['store-operation'] },
  { id: 'CREATE_URGENT_TICKET', name: '创建加急工单', icon: '\u{1F6A8}', skills: ['xinbao-dispute'] },
  { id: 'SUBMIT_EVIDENCE', name: '代为提交举证', icon: '\u{1F4CE}', skills: ['xinbao-dispute'] },
  { id: 'QUERY_REFUND_PROGRESS', name: '查询退款进度', icon: '\u23F3', skills: ['xinbao-dispute'] },
  { id: 'TRANSFER_SPECIALIST', name: '转接专属小二', icon: '\u{1F469}\u200D\u{1F4BB}', skills: ['xinbao-dispute'] },
  { id: 'SEARCH_KNOWLEDGE', name: '知识向量检索', icon: '\u{1F4DA}', skills: ['knowledge-search'] },
];

// ========== 辅助查询函数 ==========

export function getSkillById(id) {
  return REAL_SKILLS.find(s => s.id === id) || null;
}

export function getSkillName(id) {
  const s = REAL_SKILLS.find(x => x.id === id);
  return s ? s.icon + ' ' + s.name : '未知';
}

export function getSkillInfo(id) {
  return REAL_SKILLS.find(x => x.id === id) || null;
}

/** 根据 sk id 查找 sk 对象 */
export function getSubScenarioById(skId) {
  for (const skill of REAL_SKILLS) {
    const sk = (skill.subScenarios || []).find(s => s.id === skId);
    if (sk) return sk;
  }
  return null;
}

/** 根据 sk id 查找其父 Skill */
export function getParentSkill(skId) {
  const parentId = skId.split('--')[0];
  return REAL_SKILLS.find(s => s.id === parentId) || null;
}

/**
 * 迁移 sk：从源 Skill 移到目标 Skill
 * @returns {boolean} 是否成功
 */
export function moveSubScenario(skId, targetSkillId) {
  // 找到源 Skill 和 sk
  let sourceSkill = null;
  let skIndex = -1;
  for (const skill of REAL_SKILLS) {
    const idx = (skill.subScenarios || []).findIndex(s => s.id === skId);
    if (idx >= 0) {
      sourceSkill = skill;
      skIndex = idx;
      break;
    }
  }
  if (!sourceSkill || skIndex < 0) return false;

  const targetSkill = REAL_SKILLS.find(s => s.id === targetSkillId);
  if (!targetSkill || targetSkill.id === sourceSkill.id) return false;

  // 1. 从源 Skill 移除
  const sk = sourceSkill.subScenarios.splice(skIndex, 1)[0];

  // 2. 更新 sk id 前缀
  sk.id = targetSkillId + '--' + sk.name;

  // 3. 添加到目标 Skill
  targetSkill.subScenarios.push(sk);

  // 4. sk 的 capabilities 合并到目标 Skill
  for (const capId of sk.capabilities) {
    if (!targetSkill.capabilities.includes(capId)) {
      targetSkill.capabilities.push(capId);
    }
    // 同步 ALL_CAPABILITIES 中的 skills 关联
    const cap = ALL_CAPABILITIES.find(c => c.id === capId);
    if (cap && !cap.skills.includes(targetSkillId)) {
      cap.skills.push(targetSkillId);
    }
  }

  // 5. 更新 primaryCount / ruleCount
  sourceSkill.primaryCount -= sk.primaryCount;
  sourceSkill.ruleCount -= sk.ruleCount;
  targetSkill.primaryCount += sk.primaryCount;
  targetSkill.ruleCount += sk.ruleCount;

  // 6. 同步 SUB_SCENARIO_DATA
  if (SUB_SCENARIO_DATA[sourceSkill.id]) {
    const srcIdx = SUB_SCENARIO_DATA[sourceSkill.id].findIndex(d => d.name === sk.name);
    if (srcIdx >= 0) SUB_SCENARIO_DATA[sourceSkill.id].splice(srcIdx, 1);
  }
  if (!SUB_SCENARIO_DATA[targetSkillId]) SUB_SCENARIO_DATA[targetSkillId] = [];
  SUB_SCENARIO_DATA[targetSkillId].push({ name: sk.name, pct: sk.primaryPct });

  return true;
}
