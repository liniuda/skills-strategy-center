/**
 * 武器库数据 - 与 Skills 通过 relatedSkills[] 关联
 * 识别缺失的能力组件，跟踪补齐进度
 */
export const ARSENAL_TASKS = [
  { id: 'q1', name: '退款入口状态查询API', desc: '查询卖家后台退款入口是否可用的接口', category: 'API接口', categoryIcon: '\u{1F50C}', status: 'missing', priority: 'critical', relatedSkills: ['xinbao-dispute', 'refund-return'], impact: '无法自动检测退款入口状态，客服需要人工确认', solution: '对接退款中台API，新增退款入口可用性检测接口' },
  { id: 'q2', name: '纠纷小二工单派发接口', desc: '向纠纷处理小二派发加急工单的系统接口', category: '系统集成', categoryIcon: '\u{1F517}', status: 'partial', priority: 'critical', relatedSkills: ['xinbao-dispute'], impact: '加急催促只能通过备注反馈，无法直接派发工单', solution: '打通纠纷工单系统，实现自动派单和优先级标记' },
  { id: 'q3', name: '买家退货物流追踪数据源', desc: '追踪买家退货包裹的物流状态数据', category: '数据源', categoryIcon: '\u{1F4CA}', status: 'partial', priority: 'high', relatedSkills: ['refund-return', 'logistics'], impact: '退货场景无法自动确认卖家是否收货', solution: '接入菜鸟/国际物流数据源，实时获取退货包裹状态' },
  { id: 'q4', name: '纠纷处理时效监控数据源', desc: '监控每个纠纷案件的处理时效和超时状态', category: '数据源', categoryIcon: '\u{1F4CA}', status: 'missing', priority: 'critical', relatedSkills: ['xinbao-dispute'], impact: '无法自动判断纠纷是否超过承诺时效', solution: '建立纠纷时效看板数据源' },
  { id: 'q5', name: '超时自动加急触发器', desc: '纠纷超过承诺时效后自动触发加急流程', category: '自动化动作', categoryIcon: '\u26A1', status: 'missing', priority: 'high', relatedSkills: ['xinbao-dispute'], impact: '超时纠纷无法自动加急', solution: '基于时效监控数据源设置超时阈值' },
  { id: 'q6', name: '贸易术语查询API', desc: '查询订单对应的贸易术语类型(DAP/FCA/CIF等)', category: 'API接口', categoryIcon: '\u{1F50C}', status: 'available', priority: 'medium', relatedSkills: ['logistics'], impact: '已对接，可自动获取贸易术语', solution: '已完成' },
  { id: 'q7', name: '清关状态实时查询接口', desc: '查询包裹在目的国的清关进度和状态', category: 'API接口', categoryIcon: '\u{1F50C}', status: 'missing', priority: 'high', relatedSkills: ['logistics'], impact: '无法实时获知清关进度', solution: '对接目的国海关或物流商清关系统API' },
  { id: 'q8', name: '纠纷详情页举证入口检测', desc: '检测商家在纠纷详情页是否有可用的举证入口', category: '系统集成', categoryIcon: '\u{1F517}', status: 'partial', priority: 'high', relatedSkills: ['xinbao-dispute'], impact: '部分场景下举证入口不可见', solution: '完善举证入口状态检测逻辑' },
  { id: 'q9', name: '举证材料上传接口集成', desc: '支持通过API上传举证材料到纠纷系统', category: '系统集成', categoryIcon: '\u{1F517}', status: 'missing', priority: 'critical', relatedSkills: ['xinbao-dispute'], impact: '举证只能由商家手动操作', solution: '集成纠纷系统举证上传API' },
  { id: 'q10', name: '仲裁流程状态机API', desc: '查询纠纷在仲裁流程中的当前阶段', category: 'API接口', categoryIcon: '\u{1F50C}', status: 'partial', priority: 'high', relatedSkills: ['xinbao-dispute'], impact: '仲裁流程阶段判断不够精确', solution: '完善仲裁状态机API' },
  { id: 'q11', name: '短信/邮件通知商家渠道', desc: '在关键节点主动通知商家', category: '通知渠道', categoryIcon: '\u{1F4E2}', status: 'partial', priority: 'high', relatedSkills: ['xinbao-dispute'], impact: '商家只能通过主动咨询获知进展', solution: '打通商家通知中心' },
  { id: 'q12', name: '纠纷进度消息推送', desc: '纠纷处理关键节点自动推送进度消息', category: '通知渠道', categoryIcon: '\u{1F4E2}', status: 'missing', priority: 'medium', relatedSkills: ['xinbao-dispute'], impact: '商家无法及时获知仲裁进展', solution: '基于仲裁状态机变更事件触发消息推送' },
  { id: 'q13', name: '协商记录自动归档', desc: '纠纷协商结束后自动归档沟通记录', category: '自动化动作', categoryIcon: '\u26A1', status: 'missing', priority: 'medium', relatedSkills: ['xinbao-dispute', 'refund-return'], impact: '协商记录需人工整理归档', solution: '纠纷结案时自动抽取关键信息' },
  { id: 'q14', name: '退款金额自动计算引擎', desc: '根据纠纷类型和协商结果自动计算应退金额', category: '自动化动作', categoryIcon: '\u26A1', status: 'missing', priority: 'high', relatedSkills: ['refund-return', 'store-operation'], impact: '退款金额需人工计算', solution: '建立退款金额计算引擎' },
  { id: 'q15', name: '清关免责条款模板库', desc: '标准化的清关免责条款模板集合', category: '数据源', categoryIcon: '\u{1F4CA}', status: 'available', priority: 'low', relatedSkills: ['logistics'], impact: '已建立模板库', solution: '已完成' },
  { id: 'q16', name: '大促宽限规则配置接口', desc: '配置和查询大促期间特殊纠纷处理宽限规则', category: 'API接口', categoryIcon: '\u{1F50C}', status: 'missing', priority: 'medium', relatedSkills: ['store-operation'], impact: '大促宽限规则只能硬编码', solution: '建立规则配置中心API' },
  { id: 'q17', name: '统一话术模板推送引擎', desc: '将标准话术模板一键推送到客服工作台', category: '自动化动作', categoryIcon: '\u26A1', status: 'partial', priority: 'high', relatedSkills: ['xinbao-dispute'], impact: '话术模板需客服手动复制粘贴', solution: '完善话术推送引擎' },
  { id: 'q18', name: '商家沟通记录回写数据源', desc: '将客服与商家的沟通记录回写到纠纷系统', category: '数据源', categoryIcon: '\u{1F4CA}', status: 'missing', priority: 'critical', relatedSkills: ['xinbao-dispute'], impact: '纠纷小二看不到客服与商家的沟通内容', solution: '打通客服系统与纠纷系统的数据链路' },
];

export const ARSENAL_CAT_COLORS = {
  'API接口': '#3B82F6', '系统集成': '#7C3AED', '数据源': '#0EA5E9',
  '自动化动作': '#D97706', '通知渠道': '#EC4899'
};
export const ARSENAL_PRI_COLORS = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#9CA3AF' };
export const ARSENAL_PRI_LABELS = { critical: '紧急', high: '高', medium: '中', low: '低' };
export const ARSENAL_STATUS_LABELS = { missing: '缺失', partial: '部分就绪', available: '已就绪' };
