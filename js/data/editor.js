/**
 * 策略编辑器数据 - 自然语言模板与解析结果
 * 模板解析结果通过 conflicts 与已有规则关联
 */
export const NL_TEMPLATES = [
  {
    name: '纠纷退款协商',
    text: '当卖家已收到退货货物，且买卖双方已达成退款共识，但卖家后台没有退款入口时，收集卖家联系电话，将退款诉求反馈给纠纷小二加急处理。适用于信保订单，买卖双方已协商一致的退款场景。',
    result: {
      conditions: [
        { field: '纠纷状态', op: '=', value: '买卖双方已协商一致' },
        { field: '退货状态', op: '=', value: '卖家已收货' },
        { field: '退款入口', op: '=', value: '不可用' }
      ],
      actions: [
        { step: 1, type: '收集', content: '收集卖家联系电话和退款诉求' },
        { step: 2, type: '反馈', content: '将退款诉求反馈给纠纷小二，加急催促处理' }
      ],
      scope: '信保订单，买卖双方已达成退款共识',
      priority: 1,
      conflicts: [
        { msg: '与 [半托管退款流程 v1.0] 在已发货场景存在流程分支差异，需确认订单类型', level: 'warning' }
      ]
    }
  },
  {
    name: '清关责任判定',
    text: '当买家因关税问题拒绝清关或要求退款时，首先确认贸易术语（DAP/FCA/CIF等），若为 DAP 或买家负责清关的条款，则判定为买家责任；引导卖家保存沟通记录作为佐证，告知协商期操作流程，协商不成可升级平台仲裁。',
    result: {
      conditions: [
        { field: '纠纷原因', op: '=', value: '清关问题 / 买家拒付关税' },
        { field: '贸易术语', op: '\u2208', value: 'DAP / FCA（买家负责清关）' }
      ],
      actions: [
        { step: 1, type: '判定', content: '确认贸易术语，判定清关责任归属为买家' },
        { step: 2, type: '指导', content: '引导卖家保存聊天记录等佐证材料' },
        { step: 3, type: '流程', content: '指导协商期操作，协商不成可升级平台仲裁' }
      ],
      scope: '信保订单 & 半托管订单，涉及清关纠纷',
      priority: 1,
      conflicts: []
    }
  },
  {
    name: '纠纷加急催促',
    text: '当纠纷处理已超过承诺时效（1-3个工作日），或商家反映长时间未收到纠纷小二联系时，收集商家联系电话和邮箱，反馈给纠纷处理部门加急催促，备注要求今明两天内联系商家。',
    result: {
      conditions: [
        { field: '纠纷处理时长', op: '>', value: '承诺时效（1-3工作日）' },
        { field: '纠纷小二联系状态', op: '=', value: '未联系' }
      ],
      actions: [
        { step: 1, type: '收集', content: '收集商家联系电话和邮箱' },
        { step: 2, type: '催促', content: '反馈纠纷处理部门加急催促处理' },
        { step: 3, type: '备注', content: '备注要求今明两天内联系商家' }
      ],
      scope: '所有已升级仲裁的信保纠纷',
      priority: 0,
      conflicts: []
    }
  }
];

/**
 * 关键词解析引擎 - 从自然语言文本中提取结构化 IF-THEN 规则
 * 先精确匹配模板，失败则用关键词库扫描生成规则
 */

// 条件关键词库
const CONDITION_KEYWORDS = [
  { keywords: ['退款', '退钱'], field: '纠纷类型', op: '=', value: '退款相关' },
  { keywords: ['已收货', '收到货'], field: '货物状态', op: '=', value: '已收货' },
  { keywords: ['未发货', '没发货'], field: '发货状态', op: '=', value: '未发货' },
  { keywords: ['超时', '超过时效', '长时间'], field: '处理时长', op: '>', value: '承诺时效' },
  { keywords: ['未联系', '联系不上', '没有联系'], field: '联系状态', op: '=', value: '未联系' },
  { keywords: ['清关', '关税'], field: '纠纷原因', op: '=', value: '清关/关税问题' },
  { keywords: ['DAP', 'FCA', 'CIF', '贸易术语'], field: '贸易术语', op: '\u2208', value: 'DAP/FCA/CIF' },
  { keywords: ['退款入口', '没有入口', '无入口'], field: '退款入口', op: '=', value: '不可用' },
  { keywords: ['协商一致', '达成共识', '双方同意'], field: '协商状态', op: '=', value: '双方已协商一致' },
  { keywords: ['仲裁', '升级'], field: '纠纷阶段', op: '=', value: '仲裁阶段' },
  { keywords: ['举证', '证据'], field: '举证状态', op: '=', value: '需要举证' },
  { keywords: ['半托管'], field: '订单类型', op: '=', value: '半托管订单' },
  { keywords: ['信保'], field: '订单类型', op: '=', value: '信保订单' },
  { keywords: ['质量问题', '产品质量', '损坏'], field: '纠纷原因', op: '=', value: '产品质量问题' },
  { keywords: ['物流', '派送', '运输'], field: '纠纷类型', op: '=', value: '物流相关' },
];

// 动作关键词库
const ACTION_KEYWORDS = [
  { keywords: ['收集电话', '收集联系电话', '联系电话'], type: '收集', content: '收集联系电话' },
  { keywords: ['收集邮箱', '邮箱'], type: '收集', content: '收集联系邮箱' },
  { keywords: ['加急', '催促', '加急催促'], type: '催促', content: '反馈相关部门加急催促处理' },
  { keywords: ['反馈', '反馈给'], type: '反馈', content: '将诉求反馈给处理部门' },
  { keywords: ['退款', '退钱', '处理退款'], type: '执行', content: '处理退款申请' },
  { keywords: ['举证', '上传证据', '提交证据'], type: '指导', content: '指导提交举证材料' },
  { keywords: ['保存记录', '保存沟通', '佐证'], type: '指导', content: '引导保存沟通记录作为佐证' },
  { keywords: ['协商', '协商期'], type: '流程', content: '指导协商期操作流程' },
  { keywords: ['升级仲裁', '平台仲裁'], type: '流程', content: '协商不成可升级平台仲裁' },
  { keywords: ['判定', '判定责任', '责任归属'], type: '判定', content: '判定责任归属' },
  { keywords: ['确认', '核实'], type: '确认', content: '确认关键信息' },
  { keywords: ['备注', '标注'], type: '备注', content: '备注关键信息' },
];

// 范围关键词库
const SCOPE_KEYWORDS = [
  { keywords: ['信保订单', '信保'], scope: '信保订单' },
  { keywords: ['半托管', '全托管'], scope: '半托管/全托管订单' },
  { keywords: ['所有订单', '全部'], scope: '所有订单类型' },
  { keywords: ['清关纠纷', '清关'], scope: '涉及清关的纠纷' },
  { keywords: ['仲裁', '已升级'], scope: '已升级仲裁的纠纷' },
];

export function parseNLToRules(text) {
  if (!text || !text.trim()) return null;

  // 1. 先精确匹配已有模板
  const exactMatch = NL_TEMPLATES.find(t => t.text.trim() === text.trim());
  if (exactMatch) return { ...exactMatch.result, matchType: 'template', templateName: exactMatch.name };

  // 2. 关键词扫描
  const conditions = [];
  const matchedCondFields = new Set();
  for (const ck of CONDITION_KEYWORDS) {
    if (ck.keywords.some(kw => text.includes(kw)) && !matchedCondFields.has(ck.field)) {
      conditions.push({ field: ck.field, op: ck.op, value: ck.value });
      matchedCondFields.add(ck.field);
    }
  }

  const actions = [];
  const matchedActionTypes = new Set();
  for (const ak of ACTION_KEYWORDS) {
    if (ak.keywords.some(kw => text.includes(kw)) && !matchedActionTypes.has(ak.type + ak.content)) {
      actions.push({ step: actions.length + 1, type: ak.type, content: ak.content });
      matchedActionTypes.add(ak.type + ak.content);
    }
  }

  // 范围
  let scope = '通用';
  for (const sk of SCOPE_KEYWORDS) {
    if (sk.keywords.some(kw => text.includes(kw))) { scope = sk.scope; break; }
  }

  // 优先级
  let priority = 2;
  if (/加急|紧急|立即|P0/.test(text)) priority = 0;
  else if (/优先|重要|尽快/.test(text)) priority = 1;

  // 冲突检测 - 检查与模板条件的重叠
  const conflicts = [];
  for (const tpl of NL_TEMPLATES) {
    const overlapFields = tpl.result.conditions.filter(tc =>
      conditions.some(c => c.field === tc.field)
    );
    if (overlapFields.length > 0 && text.trim() !== tpl.text.trim()) {
      conflicts.push({
        msg: `与 [${tpl.name}] 在 ${overlapFields.map(f => f.field).join('、')} 条件上存在重叠，请确认是否冲突`,
        level: 'warning'
      });
    }
  }

  if (conditions.length === 0 && actions.length === 0) return null;

  return { conditions, actions, scope, priority, conflicts, matchType: 'keywords' };
}
