/**
 * 知识图谱数据 - 基于5000条客服会话挖掘
 * 4层神经网络结构：问题域 → 场景 → 解决方案 → 满意因素
 */

/* ── 总览统计 ── */
export const GRAPH_STATS = {
  totalConversations: 5000,
  validConversations: 3794,
  skillsIdentified: 18,
  scenariosMapped: 30,
  resolutionTypes: 8,
  satisfactionFactors: 8
};

/* ── 层配置 ── */
export const LAYER_CONFIG = [
  { id: 0, name: '问题域',   color: '#4F46E5', glow: '#818CF8' },
  { id: 1, name: '场景',     color: '#7C3AED', glow: '#A78BFA' },
  { id: 2, name: '解决方案', color: '#059669', glow: '#34D399' },
  { id: 3, name: '满意因素', color: '#D97706', glow: '#FBBF24' }
];

/* ── 节点 ── */
export const GRAPH_NODES = [
  // Layer 0 — Skills 问题域 (12)
  { id: 'SK01', layer: 0, name: '物流运输',       pct: 39.6, count: 1503, desc: '发货、运单追踪、清关、丢件、运费争议等' },
  { id: 'SK02', layer: 0, name: '账号与权限',     pct: 7.9,  count: 301,  desc: '子账号管理、密码重置、登录异常、权限分配' },
  { id: 'SK03', layer: 0, name: '支付与资金',     pct: 7.7,  count: 291,  desc: '提现、付款、手续费、资金冻结、到账查询' },
  { id: 'SK04', layer: 0, name: '知识产权与合规', pct: 7.0,  count: 264,  desc: '侵权申诉、品牌备案、商品违规、EPR/CE认证' },
  { id: 'SK05', layer: 0, name: '产品发布与管理', pct: 6.4,  count: 243,  desc: '发品审核、类目选择、SKU管理、主图优化' },
  { id: 'SK06', layer: 0, name: '信保订单管理',   pct: 5.7,  count: 217,  desc: '起草订单、合同确认、订单状态、确认收货' },
  { id: 'SK07', layer: 0, name: '店铺运营与装修', pct: 5.7,  count: 215,  desc: '店铺装修、活动报名、流量分析、会员管理' },
  { id: 'SK08', layer: 0, name: '退款与退货',     pct: 4.0,  count: 151,  desc: '退款申请、退货流程、金额争议、到账进度' },
  { id: 'SK09', layer: 0, name: '信保纠纷处理',   pct: 2.2,  count: 84,   desc: '纠纷发起、升级仲裁、举证、判责结果' },
  { id: 'SK10', layer: 0, name: '举证与证据',     pct: 1.8,  count: 68,   desc: '举证材料准备、证据提交、时效要求' },
  { id: 'SK11', layer: 0, name: '半托管/全托管',  pct: 1.7,  count: 65,   desc: '托管模式切换、履约规则、仓储配送' },
  { id: 'SK12', layer: 0, name: '广告与推广',     pct: 1.5,  count: 57,   desc: '直通车、推广计划、关键词投放、转化分析' },

  // Layer 1 — Scenarios 场景 (15)
  { id: 'SC01', layer: 1, name: '纠纷升级与平台介入', pct: 41.0, count: 303, desc: '升级纠纷至平台仲裁，等待判责结果' },
  { id: 'SC02', layer: 1, name: '举证与证据提交',     pct: 11.4, count: 84,  desc: '提交物流凭证、质检报告等举证材料' },
  { id: 'SC03', layer: 1, name: '退货换货流程',       pct: 10.1, count: 75,  desc: '协商退货方案，处理换货及退回物流' },
  { id: 'SC04', layer: 1, name: '物流运输问题',       pct: 5.7,  count: 42,  desc: '物流轨迹异常、清关延迟、丢件理赔' },
  { id: 'SC05', layer: 1, name: '退款操作指引',       pct: 4.2,  count: 31,  desc: '退款申请流程、退款规则、操作步骤' },
  { id: 'SC06', layer: 1, name: '订单状态查询',       pct: 3.8,  count: 28,  desc: '查询订单进度、确认收货状态、交易详情' },
  { id: 'SC07', layer: 1, name: '商品发布审核',       pct: 3.5,  count: 26,  desc: '发品被驳回、审核规则、类目选择指导' },
  { id: 'SC08', layer: 1, name: '账号安全管理',       pct: 3.2,  count: 24,  desc: '密码重置、异地登录、二次验证' },
  { id: 'SC09', layer: 1, name: '资金结算提现',       pct: 2.9,  count: 21,  desc: '提现规则、到账周期、手续费说明' },
  { id: 'SC10', layer: 1, name: '店铺装修运营',       pct: 2.6,  count: 19,  desc: '旺铺装修、活动设置、数据分析指导' },
  { id: 'SC11', layer: 1, name: '知识产权申诉',       pct: 2.3,  count: 17,  desc: '侵权申诉流程、品牌授权证明提交' },
  { id: 'SC12', layer: 1, name: '清关与海关',         pct: 2.1,  count: 16,  desc: '清关延迟、海关查验、关税计算' },
  { id: 'SC13', layer: 1, name: '合同与文档管理',     pct: 1.8,  count: 13,  desc: '合同起草、PI确认、附件管理' },
  { id: 'SC14', layer: 1, name: '仲裁流程处理',       pct: 1.6,  count: 12,  desc: '仲裁规则、申诉窗口、判定结果查看' },
  { id: 'SC15', layer: 1, name: '评价管理',           pct: 1.2,  count: 9,   desc: '评价回复、差评处理、评价申诉' },

  // Layer 2 — Resolutions 解决方案 (8)
  { id: 'RS01', layer: 2, name: '退款处理', pct: 73.9, count: 546, desc: '协商退款金额与方式，推动退款到账' },
  { id: 'RS02', layer: 2, name: '操作指引', pct: 53.2, count: 393, desc: '提供标准操作步骤，指导用户自助完成' },
  { id: 'RS03', layer: 2, name: '升级处理', pct: 48.4, count: 358, desc: '升级至专家坐席或主管，确保高难问题闭环' },
  { id: 'RS04', layer: 2, name: '等待处理', pct: 44.8, count: 331, desc: '明确等待周期与节点，安抚用户情绪' },
  { id: 'RS05', layer: 2, name: '方案协商', pct: 41.7, count: 308, desc: '提供多种解决方案供用户选择' },
  { id: 'RS06', layer: 2, name: '举证指引', pct: 38.9, count: 288, desc: '指导用户准备并提交合规举证材料' },
  { id: 'RS07', layer: 2, name: '协助沟通', pct: 9.5,  count: 70,  desc: '代为联系买家或物流方协调处理' },
  { id: 'RS08', layer: 2, name: '即时解决', pct: 2.2,  count: 16,  desc: '当场完成操作，问题即时闭环' },

  // Layer 3 — Satisfaction 满意因素 (8)
  { id: 'SF01', layer: 3, name: '礼貌用语', pct: 58.3, count: 431, desc: '使用尊称、感谢语，体现服务温度' },
  { id: 'SF02', layer: 3, name: '主动建议', pct: 53.0, count: 392, desc: '不仅回答问题，还主动给出优化建议' },
  { id: 'SF03', layer: 3, name: '闭环确认', pct: 43.6, count: 322, desc: '问题处理后主动确认是否还有其他需求' },
  { id: 'SF04', layer: 3, name: '表达歉意', pct: 37.7, count: 279, desc: '对造成的不便诚恳道歉，共情用户感受' },
  { id: 'SF05', layer: 3, name: '主动查询', pct: 28.3, count: 209, desc: '主动查询订单/物流状态，减少用户操作' },
  { id: 'SF06', layer: 3, name: '加急承诺', pct: 24.7, count: 183, desc: '承诺加急处理并明确时间节点' },
  { id: 'SF07', layer: 3, name: '共情理解', pct: 13.7, count: 101, desc: '表达对用户处境的理解与同理心' },
  { id: 'SF08', layer: 3, name: '即时解决', pct: 2.2,  count: 16,  desc: '问题在首次联系中即时解决' }
];

/* ── 边（跨层连接）── */
export const GRAPH_EDGES = [
  // Layer 0→1  Skills → Scenarios
  { from: 'SK01', to: 'SC04', weight: 0.95 },
  { from: 'SK01', to: 'SC12', weight: 0.80 },
  { from: 'SK01', to: 'SC01', weight: 0.55 },
  { from: 'SK01', to: 'SC03', weight: 0.40 },
  { from: 'SK01', to: 'SC06', weight: 0.35 },

  { from: 'SK02', to: 'SC08', weight: 0.90 },
  { from: 'SK02', to: 'SC06', weight: 0.40 },
  { from: 'SK02', to: 'SC15', weight: 0.25 },

  { from: 'SK03', to: 'SC09', weight: 0.90 },
  { from: 'SK03', to: 'SC05', weight: 0.60 },
  { from: 'SK03', to: 'SC06', weight: 0.35 },

  { from: 'SK04', to: 'SC11', weight: 0.90 },
  { from: 'SK04', to: 'SC07', weight: 0.50 },
  { from: 'SK04', to: 'SC01', weight: 0.30 },

  { from: 'SK05', to: 'SC07', weight: 0.90 },
  { from: 'SK05', to: 'SC10', weight: 0.45 },
  { from: 'SK05', to: 'SC15', weight: 0.30 },

  { from: 'SK06', to: 'SC06', weight: 0.85 },
  { from: 'SK06', to: 'SC13', weight: 0.75 },
  { from: 'SK06', to: 'SC01', weight: 0.50 },
  { from: 'SK06', to: 'SC05', weight: 0.35 },

  { from: 'SK07', to: 'SC10', weight: 0.90 },
  { from: 'SK07', to: 'SC15', weight: 0.45 },
  { from: 'SK07', to: 'SC07', weight: 0.30 },

  { from: 'SK08', to: 'SC05', weight: 0.90 },
  { from: 'SK08', to: 'SC03', weight: 0.85 },
  { from: 'SK08', to: 'SC01', weight: 0.45 },

  { from: 'SK09', to: 'SC01', weight: 0.95 },
  { from: 'SK09', to: 'SC14', weight: 0.85 },
  { from: 'SK09', to: 'SC02', weight: 0.75 },
  { from: 'SK09', to: 'SC03', weight: 0.40 },

  { from: 'SK10', to: 'SC02', weight: 0.95 },
  { from: 'SK10', to: 'SC01', weight: 0.60 },
  { from: 'SK10', to: 'SC14', weight: 0.40 },

  { from: 'SK11', to: 'SC04', weight: 0.70 },
  { from: 'SK11', to: 'SC06', weight: 0.55 },
  { from: 'SK11', to: 'SC03', weight: 0.35 },

  { from: 'SK12', to: 'SC10', weight: 0.70 },
  { from: 'SK12', to: 'SC09', weight: 0.35 },

  // Layer 1→2  Scenarios → Resolutions
  { from: 'SC01', to: 'RS03', weight: 0.90 },
  { from: 'SC01', to: 'RS01', weight: 0.85 },
  { from: 'SC01', to: 'RS04', weight: 0.70 },
  { from: 'SC01', to: 'RS05', weight: 0.60 },

  { from: 'SC02', to: 'RS06', weight: 0.95 },
  { from: 'SC02', to: 'RS04', weight: 0.50 },
  { from: 'SC02', to: 'RS02', weight: 0.40 },

  { from: 'SC03', to: 'RS01', weight: 0.90 },
  { from: 'SC03', to: 'RS05', weight: 0.70 },
  { from: 'SC03', to: 'RS04', weight: 0.55 },
  { from: 'SC03', to: 'RS07', weight: 0.35 },

  { from: 'SC04', to: 'RS04', weight: 0.80 },
  { from: 'SC04', to: 'RS07', weight: 0.65 },
  { from: 'SC04', to: 'RS01', weight: 0.50 },

  { from: 'SC05', to: 'RS02', weight: 0.90 },
  { from: 'SC05', to: 'RS01', weight: 0.75 },

  { from: 'SC06', to: 'RS02', weight: 0.85 },
  { from: 'SC06', to: 'RS04', weight: 0.40 },

  { from: 'SC07', to: 'RS02', weight: 0.90 },
  { from: 'SC07', to: 'RS04', weight: 0.35 },

  { from: 'SC08', to: 'RS02', weight: 0.85 },
  { from: 'SC08', to: 'RS08', weight: 0.50 },

  { from: 'SC09', to: 'RS02', weight: 0.80 },
  { from: 'SC09', to: 'RS04', weight: 0.55 },

  { from: 'SC10', to: 'RS02', weight: 0.90 },
  { from: 'SC10', to: 'RS08', weight: 0.30 },

  { from: 'SC11', to: 'RS06', weight: 0.80 },
  { from: 'SC11', to: 'RS03', weight: 0.60 },
  { from: 'SC11', to: 'RS02', weight: 0.45 },

  { from: 'SC12', to: 'RS04', weight: 0.85 },
  { from: 'SC12', to: 'RS07', weight: 0.55 },

  { from: 'SC13', to: 'RS02', weight: 0.85 },
  { from: 'SC13', to: 'RS05', weight: 0.45 },

  { from: 'SC14', to: 'RS03', weight: 0.90 },
  { from: 'SC14', to: 'RS06', weight: 0.75 },
  { from: 'SC14', to: 'RS04', weight: 0.50 },

  { from: 'SC15', to: 'RS02', weight: 0.80 },
  { from: 'SC15', to: 'RS05', weight: 0.40 },

  // Layer 2→3  Resolutions → Satisfaction
  { from: 'RS01', to: 'SF01', weight: 0.75 },
  { from: 'RS01', to: 'SF04', weight: 0.70 },
  { from: 'RS01', to: 'SF03', weight: 0.65 },
  { from: 'RS01', to: 'SF06', weight: 0.50 },

  { from: 'RS02', to: 'SF02', weight: 0.85 },
  { from: 'RS02', to: 'SF01', weight: 0.70 },
  { from: 'RS02', to: 'SF03', weight: 0.55 },

  { from: 'RS03', to: 'SF06', weight: 0.85 },
  { from: 'RS03', to: 'SF04', weight: 0.70 },
  { from: 'RS03', to: 'SF01', weight: 0.60 },
  { from: 'RS03', to: 'SF07', weight: 0.50 },

  { from: 'RS04', to: 'SF01', weight: 0.80 },
  { from: 'RS04', to: 'SF04', weight: 0.65 },
  { from: 'RS04', to: 'SF06', weight: 0.60 },

  { from: 'RS05', to: 'SF02', weight: 0.80 },
  { from: 'RS05', to: 'SF07', weight: 0.60 },
  { from: 'RS05', to: 'SF03', weight: 0.55 },

  { from: 'RS06', to: 'SF02', weight: 0.75 },
  { from: 'RS06', to: 'SF05', weight: 0.70 },
  { from: 'RS06', to: 'SF01', weight: 0.50 },

  { from: 'RS07', to: 'SF05', weight: 0.80 },
  { from: 'RS07', to: 'SF07', weight: 0.65 },
  { from: 'RS07', to: 'SF01', weight: 0.50 },

  { from: 'RS08', to: 'SF08', weight: 0.95 },
  { from: 'RS08', to: 'SF03', weight: 0.70 },
  { from: 'RS08', to: 'SF01', weight: 0.55 }
];
