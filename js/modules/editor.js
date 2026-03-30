/**
 * 策略编辑器模块
 * 关联：NL_TEMPLATES → 解析为 IF-THEN 规则 → 冲突检测关联已有规则
 * 支持：案例上下文预填、Skill 策略编辑、动态 NL 解析、规则可编辑、草稿持久化
 */
import { NL_TEMPLATES, parseNLToRules } from '../data/editor.js';
import { REAL_SKILLS } from '../data/skills.js';
import { showToast } from '../utils.js';
import { renderFlowchart } from '../charts.js';

let currentTemplate = 0;
let currentRule = null;
let flowchartTimer = null;

export function renderEditor() {
  // 检查上下文来源：sk 编辑 > Skill 编辑 > 案例引用 > 草稿恢复
  const fromSk = (window.sscState && window.sscState.fromSk) || null;
  const fromCase = (window.sscState && window.sscState.fromCase) || null;
  const fromSkill = (window.sscState && window.sscState.fromSkill) || null;
  const draft = (window.sscState && window.sscState.editorDraft) || null;

  let initialText = NL_TEMPLATES[0].text;
  let contextRefHtml = '';

  if (fromSk) {
    // 从看板 sk 编辑
    const caps = fromSk.capabilities.length > 0 ? fromSk.capabilities.join('\u3001') : '\u7CFB\u7EDF\u80FD\u529B';
    initialText = `\u5F53${fromSk.skillName} \u2192 ${fromSk.skName}\u573A\u666F\u4E0B\uFF0C\u9700\u8981\u8C03\u7528${caps}\u7B49\u80FD\u529B\u8FDB\u884C\u5904\u7406\u3002\u9488\u5BF9\u8BE5\u5B50\u573A\u666F\u7684${fromSk.ruleCount}\u6761\u89C4\u5219\u8FDB\u884C\u7B56\u7565\u4F18\u5316\u3002`;
    contextRefHtml = `
      <div class="editor-case-ref" id="caseRef">
        <span class="editor-case-ref-icon">${fromSk.skillIcon}</span>
        <span class="editor-case-ref-text">\u7F16\u8F91\u5B50\u573A\u666F\uFF1A${fromSk.skillName} \u203A ${fromSk.skName} / ${fromSk.version} / ${fromSk.ruleCount} \u6761\u89C4\u5219 / ${fromSk.primaryCount} \u4F1A\u8BDD (${fromSk.primaryPct}%)</span>
        <button class="editor-case-ref-close" id="removeCaseRef" title="\u79FB\u9664\u5F15\u7528">\u00D7</button>
      </div>`;
    window.sscState.fromSk = null;
  } else if (fromSkill) {
    // 从看板 Skill 生成策略描述文本
    const scenarios = fromSkill.subScenarios.length > 0 ? fromSkill.subScenarios.map(s => typeof s === 'string' ? s : s.name).join('\u3001') : '\u76F8\u5173\u573A\u666F';
    const caps = fromSkill.capabilities.length > 0 ? fromSkill.capabilities.join('\u3001') : '\u7CFB\u7EDF\u80FD\u529B';
    initialText = `\u5F53${fromSkill.name}\u573A\u666F\u4E0B\uFF0C\u6D89\u53CA${scenarios}\u7B49\u5B50\u573A\u666F\u65F6\uFF0C\u9700\u8981\u8C03\u7528${caps}\u7B49\u80FD\u529B\u8FDB\u884C\u5904\u7406\u3002${fromSkill.desc}`;
    contextRefHtml = `
      <div class="editor-case-ref" id="caseRef">
        <span class="editor-case-ref-icon">${fromSkill.icon}</span>
        <span class="editor-case-ref-text">\u7F16\u8F91\u7B56\u7565\uFF1A${fromSkill.name} / ${fromSkill.version} / ${fromSkill.ruleCount} \u6761\u89C4\u5219 / ${fromSkill.subScenarios.length} \u4E2A\u5B50\u573A\u666F</span>
        <button class="editor-case-ref-close" id="removeCaseRef" title="\u79FB\u9664\u5F15\u7528">\u00D7</button>
      </div>`;
    // 消费后清除
    window.sscState.fromSkill = null;
  } else if (fromCase) {
    // 从案例生成策略描述文本
    const scenarioPath = fromCase.scenario ? fromCase.scenario.join(' \u2192 ') : fromCase.label;
    initialText = `\u5F53${scenarioPath}\u573A\u666F\u4E0B\uFF0C\u5BA2\u6237\u8BC9\u6C42\u4E3A\u201C${fromCase.customerDemand}\u201D\u65F6\uFF0C${fromCase.resolution}\u3002\u9002\u7528\u4E8E${fromCase.sopRef || '\u76F8\u5173\u573A\u666F'}\u3002`;
    contextRefHtml = `
      <div class="editor-case-ref" id="caseRef">
        <span class="editor-case-ref-icon">\u{1F4CB}</span>
        <span class="editor-case-ref-text">\u53C2\u8003\u6848\u4F8B\uFF1A${fromCase.label} / ${fromCase.orderNo || 'N/A'} / CSAT ${fromCase.csat}</span>
        <button class="editor-case-ref-close" id="removeCaseRef" title="\u79FB\u9664\u5F15\u7528">\u00D7</button>
      </div>`;
    // 消费后清除
    window.sscState.fromCase = null;
  } else if (draft) {
    initialText = draft.text || initialText;
  }

  let html = `
    <h1 class="section-title">\u7B56\u7565\u7F16\u8F91\u5668</h1>
    <p class="section-desc">\u7528\u81EA\u7136\u8BED\u8A00\u63CF\u8FF0\u7B56\u7565\uFF0CAI \u81EA\u52A8\u89E3\u6790\u4E3A\u7ED3\u6784\u5316 IF-THEN \u89C4\u5219</p>
    ${contextRefHtml}
    <div class="editor-container">
      <div class="editor-panel">
        <h3>\u{1F4DD} \u81EA\u7136\u8BED\u8A00\u7B56\u7565\u63CF\u8FF0</h3>
        <textarea class="editor-textarea" id="nlInput" placeholder="\u8F93\u5165\u7B56\u7565\u63CF\u8FF0\uFF0C\u5982\uFF1A\u5F53\u4E70\u5BB6\u9000\u6B3E\u4E14\u5356\u5BB6\u5DF2\u6536\u8D27\u65F6\uFF0C\u6536\u96C6\u8054\u7CFB\u7535\u8BDD\u53CD\u9988\u52A0\u6025\u5904\u7406...">${initialText}</textarea>
        <div class="editor-btn-row">
          <button class="btn btn-primary" id="parseBtn">\u{1F680} \u89E3\u6790\u7B56\u7565</button>
          <button class="template-btn" data-tpl="0">\u7EA0\u7EB7\u9000\u6B3E\u534F\u5546</button>
          <button class="template-btn" data-tpl="1">\u6E05\u5173\u8D23\u4EFB\u5224\u5B9A</button>
          <button class="template-btn" data-tpl="2">\u7EA0\u7EB7\u52A0\u6025\u50AC\u4FC3</button>
        </div>
      </div>
      <div class="editor-panel" id="previewPanel" style="position:relative;">
        <h3>\u{1F4CB} \u7ED3\u6784\u5316\u89C4\u5219\u9884\u89C8</h3>
        <div id="rulePreview"><div class="empty-state">\u70B9\u51FB "\u{1F680} \u89E3\u6790\u7B56\u7565" \u67E5\u770B\u7ED3\u6784\u5316\u7ED3\u679C</div></div>
      </div>
      <div class="flowchart-panel" id="flowchartPanel" style="display:none">
        <h3>\u{1F504} \u5904\u7406\u6D41\u7A0B\u53EF\u89C6\u5316</h3>
        <div id="flowchartSVG" class="flowchart-svg-wrap"></div>
      </div>
      <div class="conflict-panel">
        <h3>\u{1F50D} \u51B2\u7A81\u68C0\u6D4B</h3>
        <div id="conflictResult"><div class="empty-state">\u89E3\u6790\u540E\u81EA\u52A8\u68C0\u6D4B\u89C4\u5219\u51B2\u7A81</div></div>
      </div>
    </div>`;
  document.getElementById('sec-editor').innerHTML = html;

  // 绑定事件
  document.getElementById('parseBtn').addEventListener('click', parseStrategy);
  document.querySelectorAll('[data-tpl]').forEach(btn => {
    btn.addEventListener('click', () => loadTemplate(parseInt(btn.dataset.tpl)));
  });

  // 移除引用
  const removeBtn = document.getElementById('removeCaseRef');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      document.getElementById('caseRef').remove();
    });
  }

  // 如果有草稿且有已解析规则，恢复显示
  if (draft && draft.rule && !fromSk && !fromCase && !fromSkill) {
    currentRule = draft.rule;
    renderEditableRules(draft.rule);
    renderConflicts(draft.rule);
    document.getElementById('flowchartPanel').style.display = 'block';
    renderFlowchart('flowchartSVG', draft.rule);
  }
}

function loadTemplate(idx) {
  currentTemplate = idx;
  currentRule = null;
  document.getElementById('nlInput').value = NL_TEMPLATES[idx].text;
  document.getElementById('previewPanel').innerHTML = '<h3>\u{1F4CB} \u7ED3\u6784\u5316\u89C4\u5219\u9884\u89C8</h3><div id="rulePreview"><div class="empty-state">\u70B9\u51FB "\u{1F680} \u89E3\u6790\u7B56\u7565" \u67E5\u770B\u7ED3\u6784\u5316\u7ED3\u679C</div></div>';
  document.getElementById('conflictResult').innerHTML = '<div class="empty-state">\u89E3\u6790\u540E\u81EA\u52A8\u68C0\u6D4B\u89C4\u5219\u51B2\u7A81</div>';
  document.getElementById('flowchartPanel').style.display = 'none';
}

function parseStrategy() {
  const btn = document.getElementById('parseBtn');
  const panel = document.getElementById('previewPanel');
  btn.disabled = true; btn.textContent = '\u23F3 AI \u89E3\u6790\u4E2D...';
  panel.innerHTML += '<div class="loading-overlay" id="parseLoading"><div class="spinner"></div><div class="loading-text">AI \u6B63\u5728\u89E3\u6790\u7B56\u7565...</div></div>';

  const text = document.getElementById('nlInput').value.trim();

  setTimeout(() => {
    const lo = document.getElementById('parseLoading'); if (lo) lo.remove();
    btn.disabled = false; btn.textContent = '\u{1F680} \u89E3\u6790\u7B56\u7565';

    // 使用动态解析引擎
    const r = parseNLToRules(text);

    if (!r) {
      panel.innerHTML = `<h3>\u{1F4CB} \u7ED3\u6784\u5316\u89C4\u5219\u9884\u89C8</h3>
        <div class="empty-state" style="color:var(--warning);">
          \u26A0\uFE0F \u672A\u80FD\u4ECE\u6587\u672C\u4E2D\u63D0\u53D6\u7ED3\u6784\u5316\u89C4\u5219<br>
          <span style="font-size:12px;color:var(--text-secondary);">\u8BF7\u8865\u5145\u573A\u666F\u6761\u4EF6\uFF08\u5982\u201C\u5F53...\u65F6\u201D\uFF09\u548C\u5904\u7406\u6B65\u9AA4\uFF08\u5982\u201C\u6536\u96C6...\u201D\u3001\u201C\u53CD\u9988...\u201D\uFF09</span>
        </div>`;
      document.getElementById('conflictResult').innerHTML = '<div class="empty-state">\u89E3\u6790\u540E\u81EA\u52A8\u68C0\u6D4B\u89C4\u5219\u51B2\u7A81</div>';
      document.getElementById('flowchartPanel').style.display = 'none';
      currentRule = null;
      return;
    }

    currentRule = r;
    renderEditableRules(r);
    renderConflicts(r);

    document.getElementById('flowchartPanel').style.display = 'block';
    renderFlowchart('flowchartSVG', r);
  }, 1200);
}

/**
 * 渲染可编辑的规则预览
 */
function renderEditableRules(r) {
  const panel = document.getElementById('previewPanel');
  const condColors = ['#4F46E5', '#7C3AED', '#0284C7', '#D97706'];

  let conditionsHtml = r.conditions.map((c, i) => `
    <div class="rule-item rule-item-editable" data-cond-idx="${i}">
      <span class="bullet" style="background:${condColors[i % condColors.length]}"></span>
      <input class="rule-edit-input rule-edit-field" value="${escHtml(c.field)}" data-key="field" placeholder="\u5B57\u6BB5">
      <select class="rule-edit-select" data-key="op">
        <option value="=" ${c.op === '=' ? 'selected' : ''}>=</option>
        <option value=">" ${c.op === '>' ? 'selected' : ''}>></option>
        <option value="<" ${c.op === '<' ? 'selected' : ''}><</option>
        <option value="\u2208" ${c.op === '\u2208' ? 'selected' : ''}>\u2208</option>
        <option value="\u2260" ${c.op === '\u2260' ? 'selected' : ''}>\u2260</option>
      </select>
      <input class="rule-edit-input rule-edit-value" value="${escHtml(c.value)}" data-key="value" placeholder="\u503C">
      <button class="rule-delete-btn" data-del-cond="${i}" title="\u5220\u9664\u6761\u4EF6">\u00D7</button>
    </div>`).join('');

  let actionsHtml = r.actions.map((a, j) => `
    <div class="rule-item rule-item-editable" data-act-idx="${j}">
      <span class="bullet" style="background:#059669"></span>
      <span class="rule-step-label">Step ${a.step}</span>
      <input class="rule-edit-input rule-edit-type" value="${escHtml(a.type)}" data-key="type" placeholder="\u7C7B\u578B" style="width:60px;">
      <input class="rule-edit-input rule-edit-content" value="${escHtml(a.content)}" data-key="content" placeholder="\u6267\u884C\u5185\u5BB9">
      <button class="rule-delete-btn" data-del-act="${j}" title="\u5220\u9664\u6B65\u9AA4">\u00D7</button>
    </div>`).join('');

  const priOptions = [0, 1, 2].map(v => {
    const labels = { 0: '\u6700\u9AD8 (P0)', 1: '\u9AD8 (P1)', 2: '\u6807\u51C6 (P2)' };
    return `<option value="${v}" ${r.priority === v ? 'selected' : ''}>${labels[v]}</option>`;
  }).join('');

  let html = `<h3>\u{1F4CB} \u7ED3\u6784\u5316\u89C4\u5219\u9884\u89C8 <span style="font-size:11px;color:var(--text-secondary);font-weight:400;">\u53EF\u7F16\u8F91</span></h3>
    <div class="rule-card">
      <div class="rule-card-title">IF \u6761\u4EF6\u7EC4\uFF08\u5168\u90E8\u6EE1\u8DB3\uFF09</div>
      <div id="conditionsList">${conditionsHtml}</div>
      <button class="rule-add-btn" id="addCondition">+ \u6DFB\u52A0\u6761\u4EF6</button>
    </div>
    <div class="rule-card" style="border-left:3px solid #059669;">
      <div class="rule-card-title" style="color:#059669;">THEN \u6267\u884C\u52A8\u4F5C</div>
      <div id="actionsList">${actionsHtml}</div>
      <button class="rule-add-btn" id="addAction">+ \u6DFB\u52A0\u6B65\u9AA4</button>
    </div>
    <div class="rule-card" style="border-left:3px solid #D97706;">
      <div class="rule-card-title" style="color:#D97706;">SCOPE \u9002\u7528\u8303\u56F4</div>
      <div class="rule-item"><input class="rule-edit-input" id="scopeInput" value="${escHtml(r.scope)}" style="width:100%;"></div>
    </div>
    <div class="rule-card" style="border-left:3px solid #DC2626;">
      <div class="rule-card-title" style="color:#DC2626;">PRIORITY \u4F18\u5148\u7EA7</div>
      <div class="rule-item"><select class="rule-edit-select" id="prioritySelect" style="width:140px;">${priOptions}</select></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn btn-secondary" id="saveDraftBtn" style="flex:1;">\u{1F4BE} \u4FDD\u5B58\u4E3A\u8349\u7A3F</button>
      <button class="module-nav-link" id="goToKanban" style="flex:1;justify-content:center;">\u{1F4CB} \u63D0\u4EA4\u5230\u770B\u677F \u2192</button>
    </div>`;
  panel.innerHTML = html;

  // 绑定编辑事件
  bindEditEvents();
}

function bindEditEvents() {
  // 条件编辑
  document.querySelectorAll('#conditionsList .rule-item-editable').forEach(item => {
    item.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', () => syncRuleFromDOM());
    });
  });

  // 动作编辑
  document.querySelectorAll('#actionsList .rule-item-editable').forEach(item => {
    item.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', () => syncRuleFromDOM());
    });
  });

  // 删除条件
  document.querySelectorAll('[data-del-cond]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.delCond);
      if (currentRule && currentRule.conditions.length > 1) {
        currentRule.conditions.splice(idx, 1);
        renderEditableRules(currentRule);
        renderConflicts(currentRule);
        scheduleFlowchartUpdate();
      } else {
        showToast('\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u6761\u4EF6', 'warning');
      }
    });
  });

  // 删除动作
  document.querySelectorAll('[data-del-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.delAct);
      if (currentRule && currentRule.actions.length > 1) {
        currentRule.actions.splice(idx, 1);
        currentRule.actions.forEach((a, i) => a.step = i + 1);
        renderEditableRules(currentRule);
        renderConflicts(currentRule);
        scheduleFlowchartUpdate();
      } else {
        showToast('\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u6B65\u9AA4', 'warning');
      }
    });
  });

  // 添加条件
  document.getElementById('addCondition').addEventListener('click', () => {
    if (!currentRule) return;
    currentRule.conditions.push({ field: '\u65B0\u6761\u4EF6', op: '=', value: '\u8BF7\u586B\u5199' });
    renderEditableRules(currentRule);
    scheduleFlowchartUpdate();
  });

  // 添加动作
  document.getElementById('addAction').addEventListener('click', () => {
    if (!currentRule) return;
    currentRule.actions.push({ step: currentRule.actions.length + 1, type: '\u6267\u884C', content: '\u8BF7\u586B\u5199\u6267\u884C\u5185\u5BB9' });
    renderEditableRules(currentRule);
    scheduleFlowchartUpdate();
  });

  // Scope 和 Priority
  const scopeInput = document.getElementById('scopeInput');
  if (scopeInput) scopeInput.addEventListener('change', () => syncRuleFromDOM());
  const priSelect = document.getElementById('prioritySelect');
  if (priSelect) priSelect.addEventListener('change', () => syncRuleFromDOM());

  // 保存草稿
  document.getElementById('saveDraftBtn').addEventListener('click', () => {
    if (!currentRule) { showToast('\u8BF7\u5148\u89E3\u6790\u7B56\u7565', 'warning'); return; }
    const text = document.getElementById('nlInput').value;
    if (window.sscState) {
      window.sscState.editorDraft = { text, rule: currentRule };
      try {
        const state = JSON.parse(localStorage.getItem('ssc_state') || '{}');
        state.editorDraft = window.sscState.editorDraft;
        localStorage.setItem('ssc_state', JSON.stringify(state));
      } catch (e) { /* ignore */ }
    }
    showToast('\u7B56\u7565\u8349\u7A3F\u5DF2\u4FDD\u5B58\uFF0C\u5237\u65B0\u9875\u9762\u540E\u53EF\u6062\u590D');
  });

  // 提交到看板
  document.getElementById('goToKanban').addEventListener('click', () => {
    if (!currentRule) { showToast('\u8BF7\u5148\u89E3\u6790\u7B56\u7565', 'warning'); return; }
    const text = document.getElementById('nlInput').value;
    // 构造临时 Skill 对象
    const draftSkill = {
      id: 'user-draft-' + Date.now(),
      name: '\u81EA\u5B9A\u4E49\u7B56\u7565',
      icon: '\u{1F4DD}',
      color: '#64748B',
      primaryCount: 0,
      primaryPct: 0,
      multiCount: 0,
      multiPct: 0,
      subScenarios: [],
      ruleCount: currentRule.conditions.length + currentRule.actions.length,
      capabilities: [],
      status: 'draft',
      version: 'v0.1.0',
      desc: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
      isUserDraft: true,
    };
    REAL_SKILLS.push(draftSkill);
    showToast('\u7B56\u7565\u5DF2\u63D0\u4EA4\u5230\u770B\u677F\uFF08\u8349\u7A3F\u72B6\u6001\uFF09');
    if (window.sscSwitchTab) window.sscSwitchTab('kanban');
  });
}

/**
 * 从 DOM 同步编辑内容到 currentRule，并更新流程图
 */
function syncRuleFromDOM() {
  if (!currentRule) return;

  // 同步条件
  document.querySelectorAll('#conditionsList .rule-item-editable').forEach((item, i) => {
    if (currentRule.conditions[i]) {
      const fieldInput = item.querySelector('[data-key="field"]');
      const opSelect = item.querySelector('[data-key="op"]');
      const valueInput = item.querySelector('[data-key="value"]');
      if (fieldInput) currentRule.conditions[i].field = fieldInput.value;
      if (opSelect) currentRule.conditions[i].op = opSelect.value;
      if (valueInput) currentRule.conditions[i].value = valueInput.value;
    }
  });

  // 同步动作
  document.querySelectorAll('#actionsList .rule-item-editable').forEach((item, j) => {
    if (currentRule.actions[j]) {
      const typeInput = item.querySelector('[data-key="type"]');
      const contentInput = item.querySelector('[data-key="content"]');
      if (typeInput) currentRule.actions[j].type = typeInput.value;
      if (contentInput) currentRule.actions[j].content = contentInput.value;
    }
  });

  // 同步 scope 和 priority
  const scopeEl = document.getElementById('scopeInput');
  if (scopeEl) currentRule.scope = scopeEl.value;
  const priEl = document.getElementById('prioritySelect');
  if (priEl) currentRule.priority = parseInt(priEl.value);

  scheduleFlowchartUpdate();
}

/**
 * 防抖更新流程图
 */
function scheduleFlowchartUpdate() {
  if (flowchartTimer) clearTimeout(flowchartTimer);
  flowchartTimer = setTimeout(() => {
    if (currentRule) {
      renderFlowchart('flowchartSVG', currentRule);
    }
  }, 500);
}

/**
 * 渲染冲突检测结果
 */
function renderConflicts(r) {
  const el = document.getElementById('conflictResult');
  if (!el) return;
  if (r.conflicts && r.conflicts.length > 0) {
    el.innerHTML = r.conflicts.map(c => `<div class="conflict-alert">\u26A0\uFE0F ${c.msg}</div>`).join('');
  } else {
    el.innerHTML = '<div class="conflict-ok">\u2705 \u672A\u68C0\u6D4B\u5230\u89C4\u5219\u51B2\u7A81</div>';
  }
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
