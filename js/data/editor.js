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
