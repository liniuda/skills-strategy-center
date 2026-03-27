/**
 * 监控数据 - 活动日志、告警、趋势
 * 告警与 REAL_SKILLS 的运行状态关联
 */
export const MOCK_ACTIVITIES = [
  { user: 'James', action: '发布了', target: '物流运输 v1.0.0', time: '10:32' },
  { user: 'Marvin', action: '提交审核', target: '退款与退货 v1.0.0', time: '10:15' },
  { user: 'Hayden', action: '更新了', target: '支付与资金 v1.0.0', time: '09:48' },
  { user: '系统', action: '灰度中', target: '信保纠纷处理 v2.0.0 (10%流量)', time: '09:30' },
  { user: 'Dark', action: '创建了', target: '知识产权与合规 v1.0.0', time: '09:12' },
  { user: 'Violet', action: '归档了', target: '旧版订单管理 v0.5', time: '昨天' },
  { user: 'James', action: '更新了', target: '账号与权限 v1.0.0', time: '昨天' },
  { user: '系统', action: '告警', target: '半托管/全托管 CSAT 低于阈值', time: '昨天' },
];

export const MOCK_ALERTS = [
  { id: 'a1', level: 'P0', msg: '[物流运输] 加急请求量今日激增 85%（可能存在批量超时）', time: '10:45', handled: false },
  { id: 'a2', level: 'P1', msg: '[信保纠纷处理] Canary 阶段 FCR 低于预期（72% < 80%）', time: '09:30', handled: false },
  { id: 'a3', level: 'P1', msg: '[退款与退货] 审核阶段 CSAT 4.0 低于发布阈值 4.3', time: '08:15', handled: false },
  { id: 'a4', level: 'P2', msg: '[物流运输] 使用量今日增加 65%（与新贸节高峰相关）', time: '07:00', handled: true },
  { id: 'a5', level: 'P2', msg: '[信保订单管理] FCR 低于团队均值（78% vs 83%）', time: '昨天', handled: true },
  { id: 'a6', level: 'P0', msg: '[半托管/全托管] CSAT 连续7天低于3.5，建议关注', time: '昨天', handled: true },
];

export const TREND_DATA = {
  dates: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 2, 23 - 29 + i);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }),
  csat: [4.1, 4.0, 4.2, 4.1, 4.3, 4.2, 4.1, 4.0, 4.2, 4.3, 4.2, 4.1, 4.3, 4.4, 4.2, 4.1, 4.0, 4.2, 4.3, 4.4, 4.3, 4.2, 4.1, 4.3, 4.2, 4.4, 4.3, 4.2, 4.1, 4.2],
  fcr: [80, 79, 82, 81, 83, 82, 80, 79, 81, 83, 82, 80, 83, 84, 82, 80, 79, 81, 83, 85, 84, 82, 81, 83, 82, 84, 83, 82, 80, 82],
};
