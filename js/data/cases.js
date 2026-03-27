/**
 * 案例库数据 - 与 Skills 通过 scenario/sopRef 关联
 * 案例可以触发策略编辑器创建新策略
 */
export const MOCK_CASES = [
  { id: 'c1', scenario: ['纠纷退款', '卖家主动退款', '已收货'], label: '纠纷退款', customerDemand: '信保订单已收货，需给买家退款但没有退款入口', resolution: '收集卖家电话反馈纠纷小二，催促加急处理退款诉求', csat: 4.8, date: '2026-03-22', sopRef: '信保纠纷退款协商 v2.0', emotion: ['平和', '焦急', '满意'], orderNo: '290156459501025095', csAgent: 'James' },
  { id: 'c2', scenario: ['仲裁举证', '产品质量', '人为损坏嫌疑'], label: '仲裁举证', customerDemand: '买家收货两周后反馈铁网螺丝柱断裂申请退款，卖家怀疑人为损坏', resolution: '指导商家在纠纷详情页进入举证入口上传证据材料', csat: 4.8, date: '2026-03-22', sopRef: '纠纷举证操作指引 v1.3', emotion: ['焦虑', '详细陈述', '理解', '配合'], orderNo: '291333142501021490', csAgent: '小何' },
  { id: 'c3', scenario: ['仲裁举证', '催促处理', '小二回电'], label: '仲裁举证', customerDemand: '纠纷小二昨天打过电话有话要强调，但咨询被自动结束了', resolution: '收集卖家电话备注反馈给纠纷小二加急回电', csat: 4.8, date: '2026-03-21', sopRef: '纠纷加急催促反馈 v1.2', emotion: ['不满', '焦躁', '感谢'], orderNo: '279927679001022403', csAgent: '小何' },
  { id: 'c4', scenario: ['物流纠纷', '派送失败', 'PO BOX地址'], label: '物流纠纷', customerDemand: 'PO BOX地址物流商无法送达，买家要求退款，不知费用谁承担', resolution: '告知当前处于协商阶段优先协商，无法一致可升级平台仲裁', csat: 4.8, date: '2026-03-21', sopRef: '仲裁流程说明话术 v1.0', emotion: ['困惑', '理解', '感谢'], orderNo: '286461815001028329', csAgent: '小何' },
  { id: 'c5', scenario: ['清关纠纷', '半托管', '买家清关风险'], label: '清关纠纷', customerDemand: '半托管订单韩国客户无法承担清关风险要退款，双方已协商退80%', resolution: '确认纠纷小二已分配，1-3工作日内联系；半托管不会不沟通直接判责', csat: 4.0, date: '2026-03-20', sopRef: '半托管退款流程 v1.0', emotion: ['焦急', '担忧', '理解'], orderNo: '293288583001023153', csAgent: 'Marvin' },
  { id: 'c6', scenario: ['仲裁举证', '加急催促', '长期未处理'], label: '仲裁举证', customerDemand: '纠纷已提交很久，平台让双方多次举证还没结果', resolution: '确认超时效收集电话，反馈纠纷处理人加急处理', csat: 4.0, date: '2026-03-20', sopRef: '纠纷加急催促反馈 v1.2', emotion: ['焦急', '无奈', '接受'], orderNo: '13117572501025646', csAgent: '小何' },
  { id: 'c7', scenario: ['纠纷退款', '操作失误', '退款不退货'], label: '纠纷退款', customerDemand: '确认退款时没注意买家改了不退货条件，要求拦截退款', resolution: '查询告知平台已向银行投递退款无法拦截，建议协商买家退货', csat: 4.0, date: '2026-03-19', sopRef: '信保纠纷退款协商 v2.0', emotion: ['着急', '失望', '接受'], orderNo: '18514568501048675', csAgent: '小何' },
  { id: 'c8', scenario: ['物流纠纷', '派送失败', '买家不交关税'], label: '物流纠纷', customerDemand: '半托管订单客户不交关税导致派送失败，问后续如何处理', resolution: '确认买家负责清关；保存联系记录作佐证；未发起售后则等自动确认收货', csat: 4.8, date: '2026-03-19', sopRef: '清关责任判定指引 v1.1', emotion: ['困惑', '担忧', '理解', '感谢'], orderNo: '291352211501022228', csAgent: 'Hayden' },
  { id: 'c9', scenario: ['仲裁举证', '货物已送达', '联系不上买家'], label: '仲裁举证', customerDemand: '订单仲裁中但货物已送到客户手里，电话和阿里都联系不上客户', resolution: '收集电话和邮箱，升级反馈纠纷小二联系处理', csat: 4.8, date: '2026-03-18', sopRef: '纠纷加急催促反馈 v1.2', emotion: ['焦急', '配合', '感谢'], orderNo: '275655730001025953', csAgent: '小何' },
  { id: 'c10', scenario: ['仲裁举证', '拍档服务', '升级仲裁'], label: '仲裁举证', customerDemand: '两个订单纠纷商家没有举证入口直接点了升级仲裁，问后续流程', resolution: '确认仲裁小二会在1-3个工作日通过电话联系商家', csat: 4.8, date: '2026-03-18', sopRef: '仲裁流程说明话术 v1.0', emotion: ['困惑', '理解', '感谢'], orderNo: '292785906501027116', csAgent: '小何' },
  { id: 'c11', scenario: ['操作指引', '税费问题', '重复收税'], label: '操作指引', customerDemand: '平台收税+DHL重复收税，买家申请退款$132，但税费非卖家收取', resolution: '查询确认税费$51.68已退还买家；$132需等案件判责；不同意可点协商举证', csat: 4.8, date: '2026-03-17', sopRef: '税费重复收取处理 v1.0', emotion: ['困惑', '焦虑', '理解'], orderNo: '289869543501022290', csAgent: '小何' },
  { id: 'c12', scenario: ['纠纷退款', '未发货', '平台仲裁'], label: '纠纷退款', customerDemand: '未发货订单纠纷升级仲裁，希望尽快处理或协商正常发货', resolution: '反馈后台专员加急，备注诉求为协商重新发货，通过邮箱跟进反馈', csat: 4.8, date: '2026-03-17', sopRef: '仲裁流程说明话术 v1.0', emotion: ['焦急', '期望协商', '感谢'], orderNo: '293479339501020499', csAgent: 'Violet' },
  { id: 'c13', scenario: ['仲裁举证', '加急催促', '等待处理'], label: '仲裁举证', customerDemand: '纠纷处理已经很久，需要纠纷小二加急联系', resolution: '确认超时效收集电话，反馈纠纷部门加急，备注今明两天内联系', csat: 4.0, date: '2026-03-16', sopRef: '纠纷加急催促反馈 v1.2', emotion: ['焦急', '不耐烦', '接受'], orderNo: '24661997501038413', csAgent: 'John' },
  { id: 'c14', scenario: ['物流纠纷', '翻译错误', '仲裁举证'], label: '物流纠纷', customerDemand: '物流信息"飞机进港"被翻译成"香港"，买家认定货物在香港实际已到英国', resolution: '建议上传所有申诉资料含邮政内网记录，收集电话催促纠纷小二加急', csat: 4.8, date: '2026-03-16', sopRef: '物流翻译错误申诉 v1.0', emotion: ['焦虑', '不解', '配合', '感谢'], orderNo: '291290971501028496', csAgent: '小何' },
  { id: 'c15', scenario: ['仲裁举证', '等待买家举证', 'FCA条款'], label: '仲裁举证', customerDemand: '买家因运费太贵申请退款，已按FCA条款发到买家货代仓库', resolution: '确认目前等待买家举证阶段，卖家暂不需操作', csat: 4.8, date: '2026-03-15', sopRef: '纠纷举证操作指引 v1.3', emotion: ['担忧', '理解', '安心'], orderNo: '17696752501045300', csAgent: '小何' },
  { id: 'c16', scenario: ['纠纷退款', '买家错购', '货物已收'], label: '纠纷退款', customerDemand: '买家自称买错产品要求退款，产品无任何问题但不退货', resolution: '确认仲裁小二已介入，等待买家举证后由小二根据双方资料处理', csat: 4.8, date: '2026-03-15', sopRef: '买家无理退款应对 v1.1', emotion: ['愤怒', '无奈', '接受等待'], orderNo: '292480311501024342', csAgent: 'Dark' },
  { id: 'c17', scenario: ['清关纠纷', 'DAP条款', '买家拒付关税'], label: '清关纠纷', customerDemand: 'DAP订单买家不愿支付关税要取消订单，货物退回将产生巨额运费', resolution: '确认DAP条款下买家负责清关，指导在协商期选择第一个选项描述情况', csat: 4.8, date: '2026-03-14', sopRef: '清关责任判定指引 v1.1', emotion: ['焦虑', '担忧', '理解', '感谢'], orderNo: '292347142501022534', csAgent: '小何' },
  { id: 'c18', scenario: ['仲裁举证', '加急催促', '联系不上买家'], label: '仲裁举证', customerDemand: '纠纷仲裁状态需要加急处理，联系不上买家', resolution: '确认已分配纠纷小二，预计1-3工作日联系，协助反馈加急', csat: 4.0, date: '2026-03-14', sopRef: '纠纷加急催促反馈 v1.2', emotion: ['焦急', '期待', '接受'], orderNo: 'N/A', csAgent: '小何' },
];

/**
 * 案例标签颜色映射
 */
export const CASE_LABEL_COLORS = {
  '纠纷退款': '#059669',
  '仲裁举证': '#7C3AED',
  '物流纠纷': '#3B82F6',
  '清关纠纷': '#D97706',
  '操作指引': '#EC4899',
};
