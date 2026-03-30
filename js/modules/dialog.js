/**
 * 对话测试模块
 * 模拟客户对话，自动匹配已发布 Skill，展示完整推理决策链
 * 左侧聊天面板 + 右侧 8 步推理链
 */
import { REAL_SKILLS, ALL_CAPABILITIES, SUB_SCENARIO_DATA } from '../data/skills.js';
import { parseNLToRules } from '../data/editor.js';
import { showToast } from '../utils.js';
import { renderFlowchart } from '../charts.js';
import {
  SKILL_KEYWORD_MAP,
  MOCK_CONVERSATIONS,
  CAPABILITY_DESCRIPTIONS,
  MATCH_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
} from '../data/dialog.js';

let chatMessages = [];
let currentMatchResult = null;
let collapsedSteps = {};

export function renderDialog() {
  const mockOptions = MOCK_CONVERSATIONS.map((c, i) =>
    `<option value="${i}">${c.title}</option>`
  ).join('');

  const html = `
    <h1 class="section-title">\u5BF9\u8BDD\u6D4B\u8BD5</h1>
    <p class="section-desc">\u6A21\u62DF\u5BA2\u6237\u5BF9\u8BDD\uFF0C\u9A8C\u8BC1 Skill \u5339\u914D\u4E0E\u51B3\u7B56\u94FE\u8DEF</p>
    <div class="dialog-container">
      <div class="dialog-chat-panel">
        <div class="dialog-chat-header">
          <span style="font-weight:600;font-size:14px;">\u{1F4AC} \u5BF9\u8BDD\u7A97\u53E3</span>
          <select class="dialog-mock-select" id="mockSelect">
            <option value="-1">\u9009\u62E9\u9884\u8BBE\u573A\u666F...</option>
            ${mockOptions}
          </select>
        </div>
        <div class="dialog-messages" id="dialogMessages">
          <div class="dialog-welcome">\u{1F44B} \u8F93\u5165\u5BA2\u6237\u95EE\u9898\u5F00\u59CB\u6D4B\u8BD5\uFF0C\u6216\u4ECE\u4E0A\u65B9\u9009\u62E9\u9884\u8BBE\u573A\u666F</div>
        </div>
        <div class="dialog-input-row">
          <textarea class="dialog-input" id="dialogInput" placeholder="\u8F93\u5165\u5BA2\u6237\u95EE\u9898\uFF0C\u5982\uFF1A\u4FE1\u4FDD\u8BA2\u5355\u5DF2\u6536\u8D27\u4F46\u627E\u4E0D\u5230\u9000\u6B3E\u5165\u53E3..." rows="2"></textarea>
          <div class="dialog-btn-group">
            <button class="btn btn-primary dialog-send-btn" id="dialogSend">\u{1F680} \u53D1\u9001</button>
            <button class="btn btn-secondary dialog-clear-btn" id="dialogClear">\u{1F5D1}\uFE0F \u6E05\u7A7A</button>
          </div>
        </div>
      </div>
      <div class="dialog-reasoning-panel" id="reasoningPanel">
        <div class="reasoning-empty">\u{1F4A1} \u53D1\u9001\u6D88\u606F\u540E\uFF0C\u6B64\u5904\u5C06\u5C55\u793A\u5B8C\u6574\u7684\u63A8\u7406\u51B3\u7B56\u94FE</div>
      </div>
    </div>`;

  document.getElementById('sec-dialog').innerHTML = html;
  bindDialogEvents();
}

function bindDialogEvents() {
  document.getElementById('dialogSend').addEventListener('click', () => {
    const input = document.getElementById('dialogInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleSendMessage(text);
  });

  document.getElementById('dialogInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('dialogSend').click();
    }
  });

  document.getElementById('dialogClear').addEventListener('click', () => {
    chatMessages = [];
    currentMatchResult = null;
    collapsedSteps = {};
    renderChatMessages();
    document.getElementById('reasoningPanel').innerHTML =
      '<div class="reasoning-empty">\u{1F4A1} \u53D1\u9001\u6D88\u606F\u540E\uFF0C\u6B64\u5904\u5C06\u5C55\u793A\u5B8C\u6574\u7684\u63A8\u7406\u51B3\u7B56\u94FE</div>';
    document.getElementById('mockSelect').value = '-1';
  });

  document.getElementById('mockSelect').addEventListener('change', (e) => {
    const idx = parseInt(e.target.value);
    if (idx >= 0) loadMockConversation(idx);
  });
}

function handleSendMessage(text) {
  chatMessages.push({ role: 'user', content: text, timestamp: new Date() });
  renderChatMessages();

  // 显示分析中
  const msgArea = document.getElementById('dialogMessages');
  const typing = document.createElement('div');
  typing.className = 'dialog-msg dialog-msg-system dialog-typing-indicator';
  typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span> AI \u5206\u6790\u4E2D...';
  msgArea.appendChild(typing);
  msgArea.scrollTop = msgArea.scrollHeight;

  setTimeout(() => {
    // 合并所有用户消息进行匹配
    const allUserText = chatMessages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    currentMatchResult = analyzeAndMatch(allUserText);
    const reply = generateReply(currentMatchResult);

    chatMessages.push({ role: 'system', content: reply, timestamp: new Date() });
    renderChatMessages();
    renderReasoningPanel(currentMatchResult);
  }, 800);
}

function loadMockConversation(idx) {
  const conv = MOCK_CONVERSATIONS[idx];
  if (!conv) return;
  chatMessages = [];
  collapsedSteps = {};

  conv.messages.forEach(m => {
    chatMessages.push({ role: m.role, content: m.content, timestamp: new Date() });
  });

  // 对最后一条用户消息进行分析
  const lastUserMsg = conv.messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  currentMatchResult = analyzeAndMatch(lastUserMsg);
  const reply = generateReply(currentMatchResult);
  chatMessages.push({ role: 'system', content: reply, timestamp: new Date() });

  renderChatMessages();
  renderReasoningPanel(currentMatchResult);
}

function renderChatMessages() {
  const el = document.getElementById('dialogMessages');
  if (chatMessages.length === 0) {
    el.innerHTML = '<div class="dialog-welcome">\u{1F44B} \u8F93\u5165\u5BA2\u6237\u95EE\u9898\u5F00\u59CB\u6D4B\u8BD5\uFF0C\u6216\u4ECE\u4E0A\u65B9\u9009\u62E9\u9884\u8BBE\u573A\u666F</div>';
    return;
  }
  el.innerHTML = chatMessages.map(m => {
    const cls = m.role === 'user' ? 'dialog-msg-user' : 'dialog-msg-system';
    const icon = m.role === 'user' ? '\u{1F464}' : '\u{1F916}';
    return `<div class="dialog-msg ${cls}"><span class="dialog-msg-icon">${icon}</span><div class="dialog-msg-content">${escHtml(m.content)}</div></div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

// ========== 匹配引擎 ==========

function analyzeAndMatch(text) {
  const result = {
    text,
    keywords: { primary: [], secondary: [], subScenario: [] },
    skillScores: [],
    matchedSkill: null,
    matchedSubScenario: null,
    subScenarioScores: [],
    rule: null,
    capabilities: [],
    priority: 2,
    priorityReason: '',
    conflicts: [],
    confidence: 0,
    confidenceLabel: '\u4F4E',
  };

  // Step 1: 关键词提取 + Step 2: Skill 评分
  const scores = [];
  REAL_SKILLS.forEach(s => {
    const kwMap = SKILL_KEYWORD_MAP[s.id];
    if (!kwMap) return;
    let score = 0;
    const reasons = [];
    const hitPrimary = [];
    const hitSecondary = [];

    // 名称匹配
    if (text.includes(s.name)) {
      score += MATCH_WEIGHTS.nameMatch;
      reasons.push('\u6280\u80FD\u540D\u79F0\u76F4\u63A5\u5339\u914D');
    }

    // 主关键词
    kwMap.primaryKeywords.forEach(kw => {
      if (text.includes(kw)) {
        score += MATCH_WEIGHTS.primaryKw;
        hitPrimary.push(kw);
        reasons.push('\u4E3B\u5173\u952E\u8BCD: ' + kw);
      }
    });

    // 副关键词
    kwMap.secondaryKeywords.forEach(kw => {
      if (text.includes(kw)) {
        score += MATCH_WEIGHTS.secondaryKw;
        hitSecondary.push(kw);
      }
    });

    // 子场景关键词
    Object.entries(kwMap.subScenarioKeywords || {}).forEach(([sub, kws]) => {
      kws.forEach(kw => {
        if (text.includes(kw)) {
          score += MATCH_WEIGHTS.subScenarioKw;
          reasons.push('\u5B50\u573A\u666F: ' + sub);
        }
      });
    });

    // 描述词重叠
    const descWords = s.desc.replace(/[/\u3001\u3002\uFF0C]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
    descWords.forEach(w => {
      if (text.includes(w)) score += MATCH_WEIGHTS.descMatch;
    });

    scores.push({
      skill: s,
      score,
      reasons: [...new Set(reasons)],
      hitPrimary,
      hitSecondary,
    });
  });

  scores.sort((a, b) => b.score - a.score);
  result.skillScores = scores.slice(0, 5);

  // 归一化置信度
  const topScore = scores[0] ? scores[0].score : 0;
  const maxPossible = Math.max(topScore * 1.5, 50);
  result.confidence = Math.min(100, Math.round((topScore / maxPossible) * 100));
  if (result.confidence >= CONFIDENCE_THRESHOLDS.high) result.confidenceLabel = '\u9AD8';
  else if (result.confidence >= CONFIDENCE_THRESHOLDS.medium) result.confidenceLabel = '\u4E2D';
  else result.confidenceLabel = '\u4F4E';

  // 收集所有命中的关键词
  if (scores[0]) {
    result.keywords.primary = scores[0].hitPrimary;
    result.keywords.secondary = scores[0].hitSecondary;
    result.matchedSkill = scores[0].skill;
  }

  // Step 3: 子场景识别
  if (result.matchedSkill) {
    const kwMap = SKILL_KEYWORD_MAP[result.matchedSkill.id];
    const subScores = [];
    Object.entries(kwMap.subScenarioKeywords || {}).forEach(([sub, kws]) => {
      let subScore = 0;
      const hits = [];
      kws.forEach(kw => {
        if (text.includes(kw)) { subScore += 5; hits.push(kw); }
      });
      // 子场景名称匹配加分
      if (text.includes(sub)) subScore += 10;
      if (subScore > 0) subScores.push({ name: sub, score: subScore, hits });
    });
    subScores.sort((a, b) => b.score - a.score);
    result.subScenarioScores = subScores;
    if (subScores.length > 0) {
      result.matchedSubScenario = subScores[0].name;
      result.keywords.subScenario = subScores[0].hits;
    } else {
      // 默认取第一个子场景
      result.matchedSubScenario = (result.matchedSkill.subScenarios || [])[0]?.name || '\u672A\u8BC6\u522B';
    }
  }

  // Step 4: 规则生成
  const parsedRule = parseNLToRules(text);
  if (parsedRule) {
    result.rule = parsedRule;
  } else if (result.matchedSkill) {
    // 兜底规则：从匹配的 Skill 信息构造
    result.rule = buildFallbackRule(result);
  }

  // Step 5: 能力调用
  if (result.matchedSkill) {
    result.capabilities = (result.matchedSkill.capabilities || [])
      .map(capId => {
        const cap = ALL_CAPABILITIES.find(c => c.id === capId);
        return cap ? {
          id: capId,
          name: cap.name,
          icon: cap.icon,
          desc: CAPABILITY_DESCRIPTIONS[capId] || '',
          invoked: isCapabilityInvoked(capId, text),
        } : null;
      })
      .filter(Boolean);
  }

  // Step 6: 优先级
  if (result.rule && result.rule.priority !== undefined) {
    result.priority = result.rule.priority;
  }
  if (/\u52A0\u6025|\u7D27\u6025|\u7ACB\u5373|\u9A6C\u4E0A|P0/.test(text)) {
    result.priority = 0;
    result.priorityReason = '\u68C0\u6D4B\u5230\u7D27\u6025\u5173\u952E\u8BCD\uFF0C\u6807\u8BB0\u4E3A\u6700\u9AD8\u4F18\u5148\u7EA7';
  } else if (/\u4F18\u5148|\u91CD\u8981|\u5C3D\u5FEB|P1/.test(text)) {
    result.priority = 1;
    result.priorityReason = '\u68C0\u6D4B\u5230\u4F18\u5148\u5173\u952E\u8BCD\uFF0C\u6807\u8BB0\u4E3A\u9AD8\u4F18\u5148\u7EA7';
  } else {
    result.priorityReason = '\u672A\u68C0\u6D4B\u5230\u7D27\u6025\u4FE1\u53F7\uFF0C\u4F7F\u7528\u6807\u51C6\u4F18\u5148\u7EA7';
  }

  // Step 7: 冲突检测
  if (result.rule && result.rule.conflicts) {
    result.conflicts = result.rule.conflicts;
  }
  // 多 Skill 高分歧义
  if (scores.length >= 2 && scores[1].score > 0) {
    const ratio = scores[1].score / Math.max(scores[0].score, 1);
    if (ratio > 0.7) {
      result.conflicts.push({
        msg: `\u591A\u4E2A Skill \u5F97\u5206\u63A5\u8FD1\uFF1A${scores[0].skill.name}(${scores[0].score}\u5206) vs ${scores[1].skill.name}(${scores[1].score}\u5206)\uFF0C\u53EF\u80FD\u5B58\u5728\u573A\u666F\u6B67\u4E49`,
      });
    }
  }

  return result;
}

function buildFallbackRule(result) {
  const s = result.matchedSkill;
  const sub = result.matchedSubScenario || '';
  const conditions = [
    { field: '\u573A\u666F', op: '=', value: s.name },
  ];
  if (sub) conditions.push({ field: '\u5B50\u573A\u666F', op: '=', value: sub });

  const actions = [];
  const caps = (s.capabilities || []).slice(0, 3);
  caps.forEach((capId, i) => {
    const cap = ALL_CAPABILITIES.find(c => c.id === capId);
    actions.push({
      step: i + 1,
      type: '\u6267\u884C',
      content: cap ? cap.name : capId,
    });
  });
  if (actions.length === 0) {
    actions.push({ step: 1, type: '\u6267\u884C', content: '\u6309\u7167\u6807\u51C6\u6D41\u7A0B\u5904\u7406' });
  }

  return {
    conditions,
    actions,
    scope: s.name + ' - ' + sub,
    priority: 2,
    conflicts: [],
  };
}

function isCapabilityInvoked(capId, text) {
  const triggers = {
    'CREATE_TICKET': ['\u5DE5\u5355', '\u53CD\u9988', '\u63D0\u4EA4'],
    'CREATE_URGENT_TICKET': ['\u52A0\u6025', '\u7D27\u6025', '\u50AC\u4FC3'],
    'QUERY_ORDER': ['\u67E5\u8BE2\u8BA2\u5355', '\u8BA2\u5355\u72B6\u6001'],
    'QUERY_LOGISTICS': ['\u7269\u6D41', '\u5FEB\u9012', '\u8FD0\u5355'],
    'QUERY_DISPUTE': ['\u7EA0\u7EB7', '\u4E3E\u8BC1', '\u4EF2\u88C1'],
    'SEND_BUYER_EMAIL': ['\u8054\u7CFB\u4E70\u5BB6', '\u90AE\u4EF6', '\u901A\u77E5'],
    'SUBMIT_EVIDENCE': ['\u4E3E\u8BC1', '\u8BC1\u636E', '\u4E0A\u4F20'],
    'TRANSFER_SPECIALIST': ['\u5C0F\u4E8C', '\u4E13\u5458', '\u8F6C\u63A5'],
    'QUERY_REFUND_PROGRESS': ['\u9000\u6B3E\u8FDB\u5EA6', '\u9000\u6B3E\u72B6\u6001'],
    'QUERY_ACCOUNT': ['\u8D26\u53F7', '\u767B\u5F55'],
    'MODIFY_ACCOUNT': ['\u4FEE\u6539\u5BC6\u7801', '\u4FEE\u6539\u8D26\u53F7'],
    'SEARCH_KNOWLEDGE': ['知识', '检索', '搜索', '知识库', '查询知识', '帮助中心', '文档'],
  };
  const kws = triggers[capId] || [];
  return kws.some(kw => text.includes(kw));
}

// ========== 客服话术模板库（基于 SKILL.md 满意度驱动因子） ==========

const CS_GREETINGS = [
  '您好亲，',
  '亲，您好！',
  '您好，',
];

const CS_EMPATHY = {
  normal: [
    '了解到您的情况了，',
    '明白您的问题了，',
    '收到您反馈的问题了，',
  ],
  frustrated: [
    '非常理解您着急的心情，',
    '抱歉给您带来不便了，',
    '您辛苦了，理解您的心情，',
    '很抱歉遇到这个问题让您困扰了，',
  ],
};

const CS_CLOSURES = [
  '如果后续还有其他问题，随时联系我们哦～',
  '还有其他需要帮助的吗？随时联系我们。',
  '希望能帮到您，有问题随时咨询～',
  '有任何疑问随时找我们哈，祝您生活愉快～',
];

// 按技能+子场景的客服话术模板
const SKILL_REPLY_MAP = {
  '纠纷升级与平台介入': {
    _default: '目前查到您的订单已进入平台仲裁阶段，纠纷小二会根据双方提供的材料进行公正判责的。在判责前纠纷小二会联系您，不会不联系直接判责哈，您这边放心。',
    '催促处理': '辛苦您给个联系电话亲，小X这边给您催促下处理的同时让纠纷小二和您联系沟通。确定的，3个工作日内纠纷小二会电话联系您哈。',
    '申请仲裁': '如果协商期内双方无法达成一致，到第4天的时候您可以手动点击升级仲裁，让纠纷小二来判责处理。在这之前建议您先整理好聊天记录、物流截图这些证据材料，到时候方便举证。',
    '纠纷小二联系': '之前纠纷小二有联系您但是没打通电话，您这边是需要纠纷小二重新联系您吗？如果需要的话辛苦提供下您的联系电话和纠纷处理页面的全屏截图，小X这边帮您加急反馈。',
    '平台判责': '纠纷小二会结合双方的举证材料来判责，目前您这边要做的就是在举证端口开放的时候尽量把对咱们有利的证据都提交上去。如果有最新进展纠纷小二会联系您的。',
  },
  '举证与证据提交': {
    _default: '关于举证这块，您这边需要在举证端口开放的时候上传相关的证据材料。一般包括聊天记录截图、物流签收凭证、质检报告这些，越详细越好哈。',
    '举证端口': '帮您看了下，目前举证端口的状态需要您在纠纷详情页面确认一下。如果端口已经开放了，就直接上传材料；如果还没开放，辛苦您提供下联系电话，小X这边帮您反馈后台催促重开端口。',
    '补充举证': '您客气了，查询到还在处理中，纠纷小二后续还会联系您核实情况或开放举证端口的。麻烦您重新提供下您的联系电话和纠纷处理页面的全屏截图，小X这边加急反馈到后台催促处理。',
    '证据类型': '建议您准备以下材料：聊天记录截图（能体现双方沟通内容的）、物流运单和签收截图、产品实物照片或视频，如果有质检报告也一起提交。这些证据越充分，对判责越有利哈。',
  },
  '退货换货流程': {
    _default: '关于退货这块，需要先确认一下是走无忧退还是普通退货流程。如果是无忧退的话，平台会提供退货运费补贴的。',
    '无忧退': '您的订单支持无忧退服务，退货运费这块平台会有补贴的。您在纠纷页面选择退货退款，按照提示操作就可以了。退货发出后记得把物流单号填到系统里哈。',
    '退货地址': '关于退货地址，需要和买家协商确认。如果联系不上买家的话，小X这边可以用官方邮件帮您尝试联系买家，希望可以帮到您。',
    '换货': '换货的话需要先和买家协商一致，确认好换货方案。然后在纠纷页面点击协商，提出换货方案让买家响应同意就可以了。',
  },
  '物流运输问题': {
    _default: '关于物流的问题，帮您了解一下情况。如果目前订单处于纠纷状态的话，是无法进行关联或发货操作的，建议亲先联系买家处理纠纷问题。',
    '物流丢件': '关于物流丢件的问题，物流赔付和信保退款是分开处理的哈。如果是阿里官方物流的话，可以帮您转接物流服务商来协助处理赔付的事情。',
    '物流延迟': '物流延迟的情况确实比较让人着急，理解您的心情。这边帮您查一下物流轨迹的最新状态，如果确实有异常，可以帮您反馈给物流服务商加急处理。',
    '海关查验': '海关查验导致的延迟是比较常见的情况，一般查验完成后会继续派送的。如果买家因为延迟发起了纠纷，建议您把物流轨迹截图作为举证材料提交。',
  },
  '退款操作指引': {
    _default: '关于退款这块，帮您看一下目前的纠纷状态。退款操作需要在纠纷详情页面进行，注意核实退款金额和退款方式哈，避免误操作。',
    '退款金额': '如果退款金额有争议的话，您可以点击协商按钮提出您认为合理的金额方案，不一定要按照买家申请的金额来退。协商金额设为0的话就表示拒绝退款。',
    '退款进度': '退款审核一般需要一些时间，到账时间取决于买家的支付方式。如果很着急的话，辛苦提供下订单号，帮您查一下退款进度。',
  },
  '协商方案引导': {
    _default: '目前纠纷处于协商期，您可以点击【协商】按钮来操作。如果要拒绝买家的退款申请，就选择拒绝，同时上传一切对咱们有利的证据举证。',
    '拒绝退款': '您可以点击【协商】按钮，选择拒绝买家的退款申请，同时上传一切有利于咱们的证据举证。需要提醒您的是，如果您这边不操作点击协商的话直接退款，后续会导致店铺有罚金的。',
    '同意退款': '点击同意后会按照买家发起申请的方案进行退款，请您确认金额无误哈。注意区分一下"退款继续订单"和"退款关闭订单"这两种方式。',
    '提出方案': '是的亲，如果您目前点击同意的话，是上一轮协商的方案。有新方案了还需要您这边响应一下，点击协商提出方案。协商原因不影响店铺考核，您放心。',
  },
  '信保订单管理': {
    _default: '关于信保订单的问题，辛苦您提供一下信保订单号，小X帮您查询一下当前的订单状态和具体情况，方便给您更准确的指引。',
  },
  '卖家响应指引': {
    _default: '当前纠纷处于待您响应状态，请在倒计时内操作响应哈。如果倒计时结束没有响应的话，会自动按照买家的方案处理的。操作路径是：纠纷详情页 → 点击"协商"。',
    '看不到按钮': '如果看不到操作按钮的话，辛苦您截图纠纷处理页面全屏给我看一下，帮您排查是什么情况。',
  },
  '赔付理赔处理': {
    _default: '关于赔付理赔的问题，需要先确认是物流赔付还是平台赔付，这两个是分开处理的。辛苦您提供下订单号，帮您看一下具体情况。',
  },
  '申诉与复议': {
    _default: '如果对判责结果有异议的话，您可以发起申诉。申诉的时候需要提供新的证据材料来支持您的诉求，之前提交过的材料也会保留。',
  },
  '通用知识检索': {
    _default: '关于您咨询的问题，小X这边已经从知识库中帮您检索到了相关信息，您可以参考一下。如果需要更详细的内容，可以告诉我具体想了解哪方面的。',
    '向量语义检索': '已通过语义检索从知识库中召回了与您问题最相关的内容，匹配度较高的知识条目已经整理给您了。如果结果不够精确，您可以补充更多关键词帮助缩小范围。',
    '知识库问答': '已在知识库中找到与您问题相关的解答，请查看以上内容。如果还有其他疑问，随时告诉我，我帮您继续查找。',
    '多语言检索': '知识检索支持中文、英文、日语、韩语等18种语言，已根据您的语言偏好检索到相关内容。如需切换语言查看，请告知我目标语言。',
    '类目知识召回': '已根据您指定的类目范围从知识库中召回了相关知识条目，您可以参考具体内容来处理问题。',
    '帮助中心查询': '已从帮助中心找到与您问题相关的指南文档，请参考以上内容操作。如果操作过程中有疑问，随时联系我们。',
  },
};

// 情绪关键词检测
const FRUSTRATED_KEYWORDS = ['投诉', '不满', '太慢', '为什么', '怎么回事', '什么时候', '着急', '催促', '等很久', '不合理', '坑', '骗', '差评', '无语', '没人管', '推诿'];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectFrustration(text) {
  return FRUSTRATED_KEYWORDS.some(kw => text.includes(kw));
}

// ========== 回复生成（客服话术风格） ==========

function generateReply(result) {
  const text = result.text || '';
  const isFrustrated = detectFrustration(text);

  if (!result.matchedSkill || result.confidence < CONFIDENCE_THRESHOLDS.medium) {
    // 低置信度 — 以客服语气引导补充信息
    const greeting = pickRandom(CS_GREETINGS);
    const empathy = isFrustrated ? pickRandom(CS_EMPATHY.frustrated) : '';
    return `${greeting}${empathy}辛苦您提供一下信保订单号或纠纷案件编号哈，小X这边帮您查一下具体情况，方便给您更准确的处理方案。`;
  }

  const s = result.matchedSkill;
  const sub = result.matchedSubScenario || '';
  const skillTemplates = SKILL_REPLY_MAP[s.name] || {};

  // 组装回复：问候 + 共情 + 场景话术 + 主动建议 + 闭环
  let parts = [];

  // 1. 礼貌问候
  parts.push(pickRandom(CS_GREETINGS));

  // 2. 共情（根据情绪强度选择）
  if (isFrustrated) {
    parts.push(pickRandom(CS_EMPATHY.frustrated));
  } else {
    parts.push(pickRandom(CS_EMPATHY.normal));
  }

  // 3. 场景话术主体（优先匹配子场景，其次技能默认）
  let body = '';
  if (sub && skillTemplates[sub]) {
    body = skillTemplates[sub];
  } else {
    body = skillTemplates._default || '';
  }

  // 如果没有模板命中，用通用客服话术
  if (!body) {
    body = `关于您反馈的问题，小X这边帮您了解一下情况。`;
  }
  parts.push(body);

  // 4. 主动建议（基于能力调用）
  const invokedCaps = result.capabilities.filter(c => c.invoked);
  if (invokedCaps.length > 0) {
    const capNames = invokedCaps.map(c => c.name);
    if (capNames.some(n => n.includes('加急') || n.includes('工单'))) {
      parts.push('\n\n小X这边已经帮您加急反馈到后台了，会有专人跟进处理的。');
    } else if (capNames.some(n => n.includes('查询'))) {
      parts.push('\n\n这边正在帮您查询相关信息，请稍等。');
    } else if (capNames.some(n => n.includes('转接'))) {
      parts.push('\n\n如果需要的话，可以帮您转接到对应的专属小二来协助处理。');
    }
  }

  // 5. 紧急标记提示（自然语气）
  if (result.priority === 0) {
    parts.push('\n\n您的问题已标记为加急处理，我们会优先跟进。');
  }

  // 6. 闭环确认
  parts.push('\n\n' + pickRandom(CS_CLOSURES));

  return parts.join('').replace(/\n{3,}/g, '\n\n').trim();
}

// ========== 推理面板渲染 ==========

function renderReasoningPanel(result) {
  const panel = document.getElementById('reasoningPanel');
  if (!result || !result.matchedSkill) {
    panel.innerHTML = '<div class="reasoning-empty">\u{1F4A1} \u672A\u80FD\u5339\u914D\u5230\u4EFB\u4F55 Skill\uFF0C\u8BF7\u8865\u5145\u66F4\u591A\u4FE1\u606F</div>';
    return;
  }

  const s = result.matchedSkill;
  const confColor = result.confidence >= 70 ? '#059669' : result.confidence >= 40 ? '#D97706' : '#DC2626';

  // 概览
  let html = `
    <div class="reasoning-summary">
      <div class="reasoning-summary-skill">${s.icon} ${s.name}</div>
      <div class="reasoning-summary-conf">
        <div class="reasoning-confidence">
          <div class="reasoning-confidence-fill" style="width:${result.confidence}%;background:${confColor};"></div>
        </div>
        <span class="reasoning-conf-label" style="color:${confColor};">${result.confidence}% ${result.confidenceLabel}</span>
      </div>
    </div>`;

  // Step 1: 关键词提取
  html += renderStep(1, '\u{1F50D}', '\u5173\u952E\u8BCD\u63D0\u53D6', () => {
    const allKw = [
      ...result.keywords.primary.map(k => `<span class="reasoning-keyword-pill kw-primary">${k}</span>`),
      ...result.keywords.secondary.map(k => `<span class="reasoning-keyword-pill kw-secondary">${k}</span>`),
      ...result.keywords.subScenario.map(k => `<span class="reasoning-keyword-pill kw-sub">${k}</span>`),
    ];
    if (allKw.length === 0) return '<span style="color:var(--text-secondary);font-size:12px;">\u672A\u63D0\u53D6\u5230\u660E\u786E\u5173\u952E\u8BCD</span>';
    return `<div style="margin-bottom:6px;font-size:11px;color:var(--text-secondary);">
      <span class="reasoning-keyword-pill kw-primary">\u4E3B\u5173\u952E\u8BCD</span>
      <span class="reasoning-keyword-pill kw-secondary">\u526F\u5173\u952E\u8BCD</span>
      <span class="reasoning-keyword-pill kw-sub">\u5B50\u573A\u666F</span>
    </div>${allKw.join(' ')}`;
  });

  // Step 2: Skill 匹配排名
  html += renderStep(2, '\u{1F3AF}', 'Skill \u5339\u914D\u6392\u540D', () => {
    return result.skillScores.filter(x => x.score > 0).map((x, i) => {
      const isTop = i === 0;
      const barW = Math.max(5, Math.round((x.score / Math.max(result.skillScores[0].score, 1)) * 100));
      return `<div class="reasoning-skill-rank ${isTop ? 'rank-top' : ''}">
        <span class="rank-pos">#${i + 1}</span>
        <span class="rank-icon">${x.skill.icon}</span>
        <span class="rank-name">${x.skill.name}</span>
        <div class="reasoning-score-bar"><div class="reasoning-score-fill" style="width:${barW}%;background:${isTop ? x.skill.color : '#CBD5E1'};"></div></div>
        <span class="rank-score">${x.score}\u5206</span>
      </div>`;
    }).join('') || '<span style="color:var(--text-secondary);font-size:12px;">\u65E0\u5339\u914D</span>';
  });

  // Step 3: 子场景识别
  html += renderStep(3, '\u{1F4C2}', '\u5B50\u573A\u666F\u8BC6\u522B', () => {
    if (!result.matchedSubScenario) return '\u672A\u8BC6\u522B\u5230\u5B50\u573A\u666F';
    let h = `<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:${s.color};">\u2192 ${result.matchedSubScenario}</div>`;
    if (result.subScenarioScores.length > 1) {
      h += '<div style="font-size:11px;color:var(--text-secondary);">\u5176\u4ED6\u5019\u9009\uFF1A';
      h += result.subScenarioScores.slice(1, 4).map(x => `${x.name}(${x.score}\u5206)`).join('\u3001');
      h += '</div>';
    }
    return h;
  });

  // Step 4: 规则生成
  html += renderStep(4, '\u{1F4CB}', '\u89C4\u5219\u751F\u6210 (IF-THEN)', () => {
    if (!result.rule) return '\u672A\u751F\u6210\u89C4\u5219';
    const r = result.rule;
    let h = '<div class="reasoning-rule-card">';
    h += '<div class="reasoning-rule-label">IF \u6761\u4EF6\u7EC4</div>';
    r.conditions.forEach(c => {
      h += `<div class="reasoning-rule-item"><span class="reasoning-rule-field">${escHtml(c.field)}</span> <span class="reasoning-rule-op">${c.op}</span> <span class="reasoning-rule-value">${escHtml(c.value)}</span></div>`;
    });
    h += '<div class="reasoning-rule-label" style="color:#059669;margin-top:8px;">THEN \u6267\u884C</div>';
    r.actions.forEach(a => {
      h += `<div class="reasoning-rule-item"><span class="reasoning-rule-step">Step ${a.step}</span> ${escHtml(a.content)}</div>`;
    });
    h += `<div class="reasoning-rule-label" style="color:#D97706;margin-top:8px;">SCOPE</div>`;
    h += `<div class="reasoning-rule-item">${escHtml(r.scope)}</div>`;
    h += '</div>';
    return h;
  });

  // Step 5: 能力调用
  html += renderStep(5, '\u26A1', '\u80FD\u529B\u8C03\u7528\u6E05\u5355', () => {
    if (result.capabilities.length === 0) return '\u65E0\u80FD\u529B\u914D\u7F6E';
    return result.capabilities.map(c => {
      const invokedCls = c.invoked ? ' cap-invoked' : '';
      return `<div class="reasoning-cap-item${invokedCls}">
        <span class="reasoning-cap-icon">${c.icon}</span>
        <div>
          <div class="reasoning-cap-name">${c.name}${c.invoked ? ' <span class="cap-badge">\u5C06\u88AB\u8C03\u7528</span>' : ''}</div>
          <div class="reasoning-cap-desc">${c.desc}</div>
        </div>
      </div>`;
    }).join('');
  });

  // Step 6: 优先级
  html += renderStep(6, '\u{1F522}', '\u4F18\u5148\u7EA7\u8BC4\u4F30', () => {
    const labels = { 0: ['P0 \u6700\u9AD8', '#DC2626'], 1: ['P1 \u9AD8', '#D97706'], 2: ['P2 \u6807\u51C6', '#64748B'] };
    const [label, color] = labels[result.priority] || labels[2];
    return `<div style="display:flex;align-items:center;gap:10px;">
      <span class="reasoning-pri-badge" style="background:${color}15;color:${color};border:1px solid ${color}30;">${label}</span>
      <span style="font-size:12px;color:var(--text-secondary);">${result.priorityReason}</span>
    </div>`;
  });

  // Step 7: 冲突检测
  html += renderStep(7, '\u26A0\uFE0F', '\u51B2\u7A81\u68C0\u6D4B', () => {
    if (result.conflicts.length === 0) {
      return '<div class="reasoning-no-conflict">\u2705 \u672A\u68C0\u6D4B\u5230\u89C4\u5219\u51B2\u7A81</div>';
    }
    return result.conflicts.map(c => `<div class="reasoning-conflict-item">\u26A0\uFE0F ${c.msg}</div>`).join('');
  });

  // Step 8: 决策流程图
  html += renderStep(8, '\u{1F5FA}\uFE0F', '\u51B3\u7B56\u6D41\u7A0B\u56FE', () => {
    return '<div id="dialogFlowchart" class="flowchart-svg-wrap" style="min-height:120px;"></div>';
  });

  panel.innerHTML = html;

  // 渲染流程图
  if (result.rule) {
    setTimeout(() => renderFlowchart('dialogFlowchart', result.rule), 100);
  }

  // 绑定折叠事件
  panel.querySelectorAll('.reasoning-step-header').forEach(header => {
    header.addEventListener('click', () => {
      const stepIdx = header.dataset.step;
      const body = header.nextElementSibling;
      if (body.style.display === 'none') {
        body.style.display = 'block';
        header.querySelector('.step-arrow').textContent = '\u25BC';
        delete collapsedSteps[stepIdx];
      } else {
        body.style.display = 'none';
        header.querySelector('.step-arrow').textContent = '\u25B6';
        collapsedSteps[stepIdx] = true;
      }
    });
  });
}

function renderStep(num, icon, title, contentFn) {
  const collapsed = collapsedSteps[num];
  const arrow = collapsed ? '\u25B6' : '\u25BC';
  const display = collapsed ? 'none' : 'block';
  return `
    <div class="reasoning-step">
      <div class="reasoning-step-header" data-step="${num}">
        <span class="reasoning-step-number">${num}</span>
        <span>${icon} ${title}</span>
        <span class="step-arrow" style="margin-left:auto;font-size:10px;color:var(--text-secondary);">${arrow}</span>
      </div>
      <div class="reasoning-step-body" style="display:${display};">
        ${contentFn()}
      </div>
    </div>`;
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
