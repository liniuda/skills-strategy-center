/**
 * 策略编辑器模块
 * 关联：NL_TEMPLATES → 解析为 IF-THEN 规则 → 冲突检测关联已有规则
 */
import { NL_TEMPLATES } from '../data/editor.js';
import { showToast } from '../utils.js';
import { renderFlowchart } from '../charts.js';

let currentTemplate = 0;

export function renderEditor() {
  let html = `
    <h1 class="section-title">策略编辑器</h1>
    <p class="section-desc">用自然语言描述策略，AI 自动解析为结构化 IF-THEN 规则</p>
    <div class="editor-container">
      <div class="editor-panel">
        <h3>\u{1F4DD} 自然语言策略描述</h3>
        <textarea class="editor-textarea" id="nlInput" placeholder="输入策略描述...">${NL_TEMPLATES[0].text}</textarea>
        <div class="editor-btn-row">
          <button class="btn btn-primary" id="parseBtn">\u{1F680} 解析策略</button>
          <button class="template-btn" data-tpl="0">纠纷退款协商</button>
          <button class="template-btn" data-tpl="1">清关责任判定</button>
          <button class="template-btn" data-tpl="2">纠纷加急催促</button>
        </div>
      </div>
      <div class="editor-panel" id="previewPanel" style="position:relative;">
        <h3>\u{1F4CB} 结构化规则预览</h3>
        <div id="rulePreview"><div class="empty-state">点击 "\u{1F680} 解析策略" 查看结构化结果</div></div>
      </div>
      <div class="flowchart-panel" id="flowchartPanel" style="display:none">
        <h3>\u{1F504} 处理流程可视化</h3>
        <div id="flowchartSVG" class="flowchart-svg-wrap"></div>
      </div>
      <div class="conflict-panel">
        <h3>\u{1F50D} 冲突检测</h3>
        <div id="conflictResult"><div class="empty-state">解析后自动检测规则冲突</div></div>
      </div>
    </div>`;
  document.getElementById('sec-editor').innerHTML = html;

  // 绑定事件
  document.getElementById('parseBtn').addEventListener('click', parseStrategy);
  document.querySelectorAll('[data-tpl]').forEach(btn => {
    btn.addEventListener('click', () => loadTemplate(parseInt(btn.dataset.tpl)));
  });
}

function loadTemplate(idx) {
  currentTemplate = idx;
  document.getElementById('nlInput').value = NL_TEMPLATES[idx].text;
  document.getElementById('previewPanel').innerHTML = '<h3>\u{1F4CB} 结构化规则预览</h3><div id="rulePreview"><div class="empty-state">点击 "\u{1F680} 解析策略" 查看结构化结果</div></div>';
  document.getElementById('conflictResult').innerHTML = '<div class="empty-state">解析后自动检测规则冲突</div>';
  document.getElementById('flowchartPanel').style.display = 'none';
}

function parseStrategy() {
  const btn = document.getElementById('parseBtn');
  const panel = document.getElementById('previewPanel');
  btn.disabled = true; btn.textContent = '\u23F3 AI 解析中...';
  panel.innerHTML += '<div class="loading-overlay" id="parseLoading"><div class="spinner"></div><div class="loading-text">AI 正在解析策略...</div></div>';
  const text = document.getElementById('nlInput').value.trim();
  let tpl = NL_TEMPLATES.find(t => t.text === text) || NL_TEMPLATES[currentTemplate];
  const r = tpl.result;

  setTimeout(() => {
    const lo = document.getElementById('parseLoading'); if (lo) lo.remove();
    btn.disabled = false; btn.textContent = '\u{1F680} 解析策略';
    const condColors = ['#4F46E5', '#7C3AED', '#0284C7', '#D97706'];
    let html = `<h3>\u{1F4CB} 结构化规则预览</h3>
      <div class="rule-card"><div class="rule-card-title">IF 条件组（全部满足）</div>
        ${r.conditions.map((c, i) => `<div class="rule-item"><span class="bullet" style="background:${condColors[i % condColors.length]}"></span>${c.field} ${c.op} ${c.value}</div>`).join('')}
      </div>
      <div class="rule-card" style="border-left:3px solid #059669;"><div class="rule-card-title" style="color:#059669;">THEN 执行动作</div>
        ${r.actions.map(a => `<div class="rule-item"><span class="bullet" style="background:#059669"></span>Step ${a.step}: ${a.content}</div>`).join('')}
      </div>
      <div class="rule-card" style="border-left:3px solid #D97706;"><div class="rule-card-title" style="color:#D97706;">SCOPE 适用范围</div>
        <div class="rule-item"><span class="bullet" style="background:#D97706"></span>${r.scope}</div>
      </div>
      <div class="rule-card" style="border-left:3px solid #DC2626;"><div class="rule-card-title" style="color:#DC2626;">PRIORITY</div>
        <div class="rule-item"><span class="bullet" style="background:#DC2626"></span>${r.priority} ${r.priority === 0 ? '（最高）' : r.priority === 1 ? '（高）' : '（标准）'}</div>
      </div>
      <button class="btn btn-primary" id="saveDraftBtn" style="margin-top:12px;width:100%;">\u{1F4BE} 保存为草稿</button>
      <button class="module-nav-link" id="goToKanban" style="margin-top:8px;width:100%;justify-content:center;">\u{1F4CB} 提交到看板 \u2192</button>`;
    panel.innerHTML = html;

    document.getElementById('saveDraftBtn').addEventListener('click', () => showToast('策略已保存为草稿'));
    document.getElementById('goToKanban').addEventListener('click', () => {
      showToast('策略已提交到看板');
      if (window.sscSwitchTab) window.sscSwitchTab('kanban');
    });

    if (r.conflicts.length > 0) {
      document.getElementById('conflictResult').innerHTML = r.conflicts.map(c => `<div class="conflict-alert">\u26A0\uFE0F ${c.msg}</div>`).join('');
    } else {
      document.getElementById('conflictResult').innerHTML = '<div class="conflict-ok">\u2705 未检测到规则冲突</div>';
    }
    document.getElementById('flowchartPanel').style.display = 'block';
    renderFlowchart('flowchartSVG', r);
  }, 1500);
}
