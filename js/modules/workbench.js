/**
 * 分析工作台模块
 * 上传会话文件 → 自动分析拆解 → 冲突检测 → 一键部署
 */
import { SKILL_KEYWORDS, SUB_SCENARIO_KEYWORDS, CSV_COLUMN_MAP } from '../data/workbench.js';
import { REAL_SKILLS, ALL_CAPABILITIES } from '../data/skills.js';
import { MOCK_CASES, CASE_LABEL_COLORS } from '../data/cases.js';
import { NL_TEMPLATES } from '../data/editor.js';
import { ARSENAL_TASKS } from '../data/arsenal.js';
import { showToast } from '../utils.js';

const STORAGE_KEY = 'ssc_analyses';
let expandedCardId = null;

/* ═══════════════════════════════════════
   localStorage 持久化
   ═══════════════════════════════════════ */
function loadAnalyses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveAnalyses(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ═══════════════════════════════════════
   主渲染
   ═══════════════════════════════════════ */
export function renderWorkbench() {
  const el = document.getElementById('sec-workbench');
  const analyses = loadAnalyses();

  el.innerHTML = `
    <h1 class="section-title">分析工作台</h1>
    <p class="section-desc">上传客服会话数据，自动拆解 Skill、生成策略规则并检测冲突</p>

    <div class="wb-upload-zone" id="wbUploadZone">
      <div class="wb-upload-content" id="wbUploadContent">
        <svg class="wb-upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div class="wb-upload-text">拖拽文件到此处，或 <span class="wb-upload-link">点击选择文件</span></div>
        <div class="wb-upload-hint">支持 XLSX / CSV / JSON / TXT 格式的会话数据文件</div>
      </div>
      <input type="file" id="wbFileInput" accept=".xlsx,.xls,.csv,.json,.txt" style="display:none">
    </div>

    <div id="wbCardGrid" class="wb-card-grid"></div>
  `;

  initUploadZone();
  renderCards(analyses);
}

/* ═══════════════════════════════════════
   上传区域交互
   ═══════════════════════════════════════ */
function initUploadZone() {
  const zone = document.getElementById('wbUploadZone');
  const input = document.getElementById('wbFileInput');

  zone.addEventListener('click', (e) => {
    if (e.target.closest('#wbAnalyzeBtn') || e.target.closest('#wbCancelBtn')) return;
    if (!zone.classList.contains('analyzing')) input.click();
  });

  input.addEventListener('change', (e) => {
    if (e.target.files.length) showFileInfo(e.target.files[0]);
  });

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length) showFileInfo(e.dataTransfer.files[0]);
  });
}

function showFileInfo(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'json', 'txt', 'xlsx', 'xls'].includes(ext)) {
    showToast('不支持的文件格式，请上传 XLSX/CSV/JSON/TXT', 'warning');
    return;
  }
  const sizeStr = file.size < 1024 ? file.size + ' B' : (file.size / 1024).toFixed(1) + ' KB';
  const content = document.getElementById('wbUploadContent');
  content.innerHTML = `
    <div class="wb-file-info">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <div>
        <div style="font-weight:600;font-size:14px;">${file.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);">${sizeStr} · ${ext.toUpperCase()}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn btn-primary" id="wbAnalyzeBtn">开始分析</button>
      <button class="btn btn-secondary" id="wbCancelBtn">取消</button>
    </div>`;

  document.getElementById('wbAnalyzeBtn').addEventListener('click', () => startAnalysis(file));
  document.getElementById('wbCancelBtn').addEventListener('click', () => renderWorkbench());
}

/* ═══════════════════════════════════════
   分析流程
   ═══════════════════════════════════════ */
function startAnalysis(file) {
  const zone = document.getElementById('wbUploadZone');
  const content = document.getElementById('wbUploadContent');
  zone.classList.add('analyzing');

  const steps = ['读取文件...', '解析会话数据...', '关键词匹配中...', '生成策略规则...', '冲突检测中...'];
  let stepIdx = 0;
  content.innerHTML = `
    <div class="wb-analyzing">
      <div class="spinner"></div>
      <div class="wb-analyze-step" id="wbAnalyzeStep">${steps[0]}</div>
      <div class="wb-analyze-progress"><div class="wb-analyze-bar" id="wbAnalyzeBar"></div></div>
    </div>`;

  const stepTimer = setInterval(() => {
    stepIdx++;
    if (stepIdx < steps.length) {
      document.getElementById('wbAnalyzeStep').textContent = steps[stepIdx];
      document.getElementById('wbAnalyzeBar').style.width = ((stepIdx + 1) / steps.length * 100) + '%';
    }
  }, 500);

  const reader = new FileReader();
  reader.onload = (e) => {
    const ext = file.name.split('.').pop().toLowerCase();
    setTimeout(() => {
      clearInterval(stepTimer);
      try {
        const records = parseFile(e.target.result, ext);
        if (!records.length) {
          showToast('未解析到有效会话数据', 'warning');
          renderWorkbench();
          return;
        }
        const analysis = analyzeConversations(records, file);
        const analyses = loadAnalyses();
        analyses.unshift(analysis);
        saveAnalyses(analyses);
        showToast(`分析完成：识别 ${analysis.conversationCount} 条会话，主技能「${analysis.matchedSkill.name}」`);
        renderWorkbench();
      } catch (err) {
        console.error('Analysis error:', err);
        showToast('分析失败: ' + err.message, 'warning');
        renderWorkbench();
      }
    }, 2500);
  };
  // XLSX/XLS 需要 ArrayBuffer，其他用 Text
  const extForRead = file.name.split('.').pop().toLowerCase();
  if (extForRead === 'xlsx' || extForRead === 'xls') {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file, 'UTF-8');
  }
}

/* ═══════════════════════════════════════
   文件解析
   ═══════════════════════════════════════ */
function parseFile(content, ext) {
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(content);
  if (ext === 'json') return parseJSON(content);
  if (ext === 'csv') return parseCSV(content);
  return parseTXT(content);
}

function parseXLSX(arrayBuffer) {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX 解析库未加载，请检查网络连接后刷新页面');
  }
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const allRecords = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // 转为 JSON 对象数组，自动用第一行做 header
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) continue;
    // 尝试匹配列名
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    const fieldMapping = {};
    for (const [field, aliases] of Object.entries(CSV_COLUMN_MAP)) {
      const matched = keys.find(k => aliases.some(a => k.toLowerCase().includes(a.toLowerCase())));
      if (matched) fieldMapping[field] = matched;
    }
    // 如果没有匹配到任何列名，尝试将所有文本列拼接作为 text
    const hasMapping = Object.keys(fieldMapping).length > 0;
    for (const row of rows) {
      if (hasMapping) {
        const obj = {};
        for (const [field, colName] of Object.entries(fieldMapping)) {
          obj[field] = String(row[colName] || '').trim();
        }
        const record = normalizeRecord(obj);
        if (record.text) allRecords.push(record);
      } else {
        // 兜底：拼接所有单元格文本
        const allText = keys.map(k => String(row[k] || '')).join(' ').trim();
        if (allText) {
          allRecords.push({
            text: allText,
            customerDemand: allText.slice(0, 200),
            resolution: '',
            csat: 0,
            date: '',
            orderNo: '',
            agent: ''
          });
        }
      }
    }
  }
  return allRecords;
}

function parseJSON(content) {
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  const data = JSON.parse(content);
  const arr = Array.isArray(data) ? data : [data];
  return arr.map(item => normalizeRecord(item)).filter(r => r.text);
}

function parseCSV(content) {
  // 去除 BOM 标记
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const colMap = {};
  for (const [field, aliases] of Object.entries(CSV_COLUMN_MAP)) {
    const idx = headers.findIndex(h => aliases.some(a => h.toLowerCase().includes(a.toLowerCase())));
    if (idx >= 0) colMap[field] = idx;
  }
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const obj = {};
    for (const [field, idx] of Object.entries(colMap)) {
      obj[field] = (cols[idx] || '').replace(/^["']|["']$/g, '').trim();
    }
    return normalizeRecord(obj);
  }).filter(r => r.text);
}

function splitCSVLine(line) {
  const cols = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

function parseTXT(content) {
  const blocks = content.split(/\n{2,}|^---+$/m).map(b => b.trim()).filter(Boolean);
  return blocks.map(block => ({
    text: block,
    customerDemand: block.split(/[。！？\n]/)[0] || block.slice(0, 100),
    resolution: '',
    csat: 0,
    date: '',
    orderNo: '',
    agent: ''
  }));
}

function normalizeRecord(obj) {
  const demand = obj.customerDemand || obj.customer_demand || obj.demand || obj.question || obj.issue || obj.problem || '';
  const resolution = obj.resolution || obj.solution || obj.answer || obj.response || '';
  return {
    text: (demand + ' ' + resolution).trim(),
    customerDemand: demand,
    resolution,
    csat: parseFloat(obj.csat || obj.score || obj.satisfaction || obj.rating) || 0,
    date: obj.date || obj.time || obj.created_at || '',
    orderNo: obj.orderNo || obj.order_no || obj.order_id || '',
    agent: obj.agent || obj.handler || obj.operator || ''
  };
}

/* ═══════════════════════════════════════
   分析引擎 — 关键词匹配
   ═══════════════════════════════════════ */
function analyzeConversations(records, file) {
  // 1. 关键词匹配
  const skillScores = {};
  const recordMatches = [];
  for (const r of records) {
    const scores = {};
    for (const [skillId, cfg] of Object.entries(SKILL_KEYWORDS)) {
      let score = 0;
      for (const kw of cfg.keywords) {
        if (r.text.includes(kw)) score += cfg.weight;
      }
      if (score > 0) scores[skillId] = score;
    }
    const bestSkill = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const matched = bestSkill ? bestSkill[0] : null;
    recordMatches.push({ ...r, matchedSkillId: matched, scores });
    if (matched) skillScores[matched] = (skillScores[matched] || 0) + 1;
  }

  // 2. 技能分布
  const total = records.length;
  const skillBreakdown = Object.entries(skillScores)
    .sort((a, b) => b[1] - a[1])
    .map(([skillId, count]) => {
      const sk = REAL_SKILLS.find(s => s.id === skillId);
      return { skillId, skillName: sk ? sk.name : skillId, icon: sk?.icon || '', count, pct: Math.round(count / total * 100) };
    });

  const primarySkillId = skillBreakdown[0]?.skillId || 'logistics';
  const primarySkill = REAL_SKILLS.find(s => s.id === primarySkillId) || REAL_SKILLS[0];

  // 3. 子场景分布
  const subMap = SUB_SCENARIO_KEYWORDS[primarySkillId] || {};
  const subCounts = {};
  for (const r of recordMatches.filter(r => r.matchedSkillId === primarySkillId)) {
    for (const [subName, kws] of Object.entries(subMap)) {
      if (kws.some(kw => r.text.includes(kw))) {
        subCounts[subName] = (subCounts[subName] || 0) + 1;
      }
    }
  }
  const matchedCount = skillScores[primarySkillId] || 1;
  const subScenarios = Object.entries(subCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: Math.round(count / matchedCount * 100) }));

  // 4. 样本会话
  const samples = recordMatches
    .filter(r => r.matchedSkillId === primarySkillId && r.customerDemand)
    .slice(0, 5)
    .map(r => ({
      text: r.text.slice(0, 200),
      matchedSkill: primarySkill.name,
      customerDemand: r.customerDemand.slice(0, 100),
      resolution: r.resolution.slice(0, 100)
    }));

  // 5. 草稿规则
  const draftRules = generateDraftRules(primarySkill, subScenarios, samples);

  // 6. 草稿案例
  const draftCases = generateDraftCases(recordMatches.filter(r => r.matchedSkillId === primarySkillId), primarySkill);

  // 7. 能力校验
  const existingCaps = primarySkill.capabilities || [];
  const allCapsForSkill = ALL_CAPABILITIES.filter(c => c.skills.includes(primarySkillId)).map(c => c.id);
  const missingCaps = ARSENAL_TASKS
    .filter(t => t.relatedSkills.includes(primarySkillId) && t.status === 'missing')
    .map(t => t.name);

  // 8. 冲突检测
  const conflicts = detectConflicts(primarySkill, subScenarios, draftRules);

  const ext = file.name.split('.').pop().toLowerCase();
  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileSize: file.size,
    fileType: ext,
    createdAt: Date.now(),
    status: conflicts.some(c => c.level === 'warning') ? '冲突' : '待审核',
    conversationCount: total,
    matchedSkill: {
      id: primarySkill.id,
      name: primarySkill.name,
      icon: primarySkill.icon,
      color: primarySkill.color,
      confidence: Math.round((skillScores[primarySkillId] || 0) / total * 100)
    },
    skillBreakdown,
    subScenarios,
    sampleConversations: samples,
    draftRules,
    draftCases,
    capabilities: { existing: allCapsForSkill, missing: missingCaps },
    conflicts,
    deployedAt: null
  };
}

/* ═══════════════════════════════════════
   规则生成
   ═══════════════════════════════════════ */
function generateDraftRules(skill, subScenarios, samples) {
  if (!subScenarios.length) return [];
  const topSub = subScenarios[0];
  const rules = [{
    name: `${skill.name} - ${topSub.name}处理策略`,
    text: `当客户咨询涉及${skill.name}的${topSub.name}场景时，按照标准流程处理`,
    result: {
      conditions: [
        { field: '技能域', op: '=', value: skill.name },
        { field: '子场景', op: '包含', value: topSub.name }
      ],
      actions: [
        { step: 1, type: '判断', content: `确认${topSub.name}的具体情况` },
        { step: 2, type: '处理', content: `按${skill.name}标准SOP执行处理` },
        { step: 3, type: '闭环', content: '确认客户满意并关闭工单' }
      ],
      scope: `${skill.name} > ${topSub.name}`,
      priority: subScenarios[0].pct > 30 ? 0 : 1,
      conflicts: []
    }
  }];
  if (subScenarios.length > 1) {
    const sub2 = subScenarios[1];
    rules.push({
      name: `${skill.name} - ${sub2.name}处理策略`,
      text: `当客户咨询涉及${skill.name}的${sub2.name}场景时，按照标准流程处理`,
      result: {
        conditions: [
          { field: '技能域', op: '=', value: skill.name },
          { field: '子场景', op: '包含', value: sub2.name }
        ],
        actions: [
          { step: 1, type: '收集', content: '收集客户订单号和具体问题' },
          { step: 2, type: '处理', content: `按${sub2.name}流程处理` }
        ],
        scope: `${skill.name} > ${sub2.name}`,
        priority: 1,
        conflicts: []
      }
    });
  }
  return rules;
}

/* ═══════════════════════════════════════
   案例生成
   ═══════════════════════════════════════ */
function generateDraftCases(records, skill) {
  return records
    .filter(r => r.customerDemand && r.resolution)
    .slice(0, 3)
    .map((r, i) => ({
      id: 'draft-' + Date.now() + '-' + i,
      scenario: [skill.name],
      label: skill.name,
      customerDemand: r.customerDemand.slice(0, 150),
      resolution: r.resolution.slice(0, 150),
      csat: r.csat || 4.0,
      date: r.date || new Date().toISOString().slice(0, 10),
      sopRef: `${skill.name} v1.0`,
      emotion: ['咨询'],
      orderNo: r.orderNo || 'N/A',
      csAgent: r.agent || '系统导入'
    }));
}

/* ═══════════════════════════════════════
   冲突检测
   ═══════════════════════════════════════ */
function detectConflicts(skill, subScenarios, draftRules) {
  const conflicts = [];
  // 1. 技能重名检测
  const existing = REAL_SKILLS.find(s => s.id === skill.id);
  if (existing) {
    conflicts.push({
      type: 'skill_exists',
      msg: `技能「${skill.name}」已存在于线上环境 (${existing.version})，部署将追加数据`,
      level: 'info',
      relatedSkillId: skill.id
    });
  }
  // 2. 子场景重复
  if (existing) {
    for (const sub of subScenarios) {
      if (existing.subScenarios.includes(sub.name)) {
        conflicts.push({
          type: 'sub_overlap',
          msg: `子场景「${sub.name}」已存在于「${skill.name}」中`,
          level: 'warning',
          relatedSkillId: skill.id
        });
      }
    }
  }
  // 3. 规则重叠
  for (const rule of draftRules) {
    for (const tpl of NL_TEMPLATES) {
      const tplFields = (tpl.result?.conditions || []).map(c => c.field);
      const ruleFields = rule.result.conditions.map(c => c.field);
      const overlap = ruleFields.filter(f => tplFields.includes(f)).length;
      if (tplFields.length > 0 && overlap / tplFields.length >= 0.7) {
        conflicts.push({
          type: 'rule_overlap',
          msg: `规则「${rule.name}」与已有模板「${tpl.name}」的条件字段存在重叠`,
          level: 'warning',
          relatedSkillId: skill.id
        });
      }
    }
  }
  // 4. 能力缺口
  const missingTasks = ARSENAL_TASKS.filter(t => t.relatedSkills.includes(skill.id) && t.status === 'missing');
  if (missingTasks.length > 0) {
    conflicts.push({
      type: 'capability_gap',
      msg: `该技能有 ${missingTasks.length} 个系统能力缺失 (${missingTasks.slice(0, 2).map(t => t.name).join('、')}${missingTasks.length > 2 ? '等' : ''})`,
      level: 'info',
      relatedSkillId: skill.id
    });
  }
  return conflicts;
}

/* ═══════════════════════════════════════
   卡片网格渲染
   ═══════════════════════════════════════ */
function renderCards(analyses) {
  const grid = document.getElementById('wbCardGrid');
  if (!analyses.length) {
    grid.innerHTML = `
      <div class="wb-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
        <div>尚无分析记录</div>
        <div style="font-size:12px;color:var(--text-secondary);">上传会话数据文件开始第一次分析</div>
      </div>`;
    return;
  }

  grid.innerHTML = analyses.map(a => {
    const statusCls = a.status === '已部署' ? 'deployed' : a.status === '冲突' ? 'conflict' : 'pending';
    const timeStr = new Date(a.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const sizeStr = a.fileSize < 1024 ? a.fileSize + 'B' : (a.fileSize / 1024).toFixed(1) + 'KB';
    return `
    <div class="wb-card ${expandedCardId === a.id ? 'expanded' : ''}" data-analysis-id="${a.id}">
      <div class="wb-card-header" data-toggle-id="${a.id}">
        <div class="wb-card-top">
          <span class="wb-status-badge ${statusCls}">${a.status}</span>
          <button class="wb-card-delete" data-delete-id="${a.id}" title="删除">&times;</button>
        </div>
        <div class="wb-card-file">${a.fileName} <span style="color:var(--text-secondary);font-size:11px;">(${sizeStr})</span></div>
        <div class="wb-card-skill" style="color:${a.matchedSkill.color}">
          ${a.matchedSkill.icon} ${a.matchedSkill.name}
          <span style="font-size:11px;opacity:.7;">${a.matchedSkill.confidence}% 置信度</span>
        </div>
        <div class="wb-card-stats">${a.conversationCount}条会话 · ${a.subScenarios.length}个子场景 · ${a.draftRules.length}条规则</div>
        <div class="wb-card-time">${timeStr}</div>
      </div>
      ${expandedCardId === a.id ? renderDetailPanel(a) : ''}
    </div>`;
  }).join('');

  // 绑定事件
  grid.querySelectorAll('[data-toggle-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-id]')) return;
      toggleDetail(el.dataset.toggleId);
    });
  });
  grid.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAnalysis(btn.dataset.deleteId);
    });
  });
  grid.querySelectorAll('[data-deploy-id]').forEach(btn => {
    btn.addEventListener('click', () => showDeployConfirmation(btn.dataset.deployId));
  });
}

/* ═══════════════════════════════════════
   详情面板
   ═══════════════════════════════════════ */
function renderDetailPanel(a) {
  const warningConflicts = a.conflicts.filter(c => c.level === 'warning');
  const infoConflicts = a.conflicts.filter(c => c.level === 'info');

  return `
  <div class="wb-detail">
    <!-- 技能分布 -->
    <div class="wb-section">
      <h4>技能匹配分布</h4>
      <div class="bar-chart">
        ${a.skillBreakdown.slice(0, 5).map(s => `
          <div class="bar-item">
            <div class="bar-label">${s.icon} ${s.skillName}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${s.pct}%;background:${REAL_SKILLS.find(sk => sk.id === s.skillId)?.color || 'var(--primary)'}"><span>${s.pct}%</span></div></div>
            <div class="bar-count">${s.count}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- 子场景 -->
    ${a.subScenarios.length ? `
    <div class="wb-section">
      <h4>子场景分布</h4>
      <div class="wb-sub-list">
        ${a.subScenarios.map(s => `
          <div class="wb-sub-item">
            <span class="wb-sub-name">${s.name}</span>
            <span class="wb-sub-bar"><span style="width:${s.pct}%"></span></span>
            <span class="wb-sub-count">${s.count}次 (${s.pct}%)</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- 样本会话 -->
    ${a.sampleConversations.length ? `
    <div class="wb-section">
      <h4>样本会话 (前${a.sampleConversations.length}条)</h4>
      <div class="case-list" style="font-size:12px;">
        <div class="case-header" style="grid-template-columns:1fr 1fr;">
          <div>客户诉求</div><div>解决方案</div>
        </div>
        ${a.sampleConversations.map(s => `
          <div class="case-row" style="grid-template-columns:1fr 1fr;cursor:default;">
            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.customerDemand || '-'}</div>
            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-secondary);">${s.resolution || '-'}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- 策略规则 -->
    ${a.draftRules.length ? `
    <div class="wb-section">
      <h4>生成的策略规则</h4>
      ${a.draftRules.map(r => `
        <div class="rule-card">
          <div class="rule-card-title">${r.name}</div>
          <div style="font-size:12px;margin-bottom:8px;color:var(--text-secondary);">IF 条件</div>
          ${r.result.conditions.map(c => `<div class="rule-item"><span class="bullet" style="background:var(--primary)"></span>${c.field} ${c.op} ${c.value}</div>`).join('')}
          <div style="font-size:12px;margin:8px 0 4px;color:#059669;">THEN 动作</div>
          ${r.result.actions.map(a => `<div class="rule-item"><span class="bullet" style="background:#059669"></span>Step ${a.step}: ${a.content}</div>`).join('')}
        </div>`).join('')}
    </div>` : ''}

    <!-- 冲突检测 -->
    <div class="wb-section">
      <h4>冲突检测</h4>
      ${warningConflicts.map(c => `<div class="conflict-alert">\u26A0\uFE0F ${c.msg}</div>`).join('')}
      ${infoConflicts.map(c => `<div class="conflict-ok">\u2139\uFE0F ${c.msg}</div>`).join('')}
      ${!a.conflicts.length ? '<div class="conflict-ok">\u2705 未检测到冲突</div>' : ''}
    </div>

    <!-- 能力校验 -->
    <div class="wb-section">
      <h4>能力校验</h4>
      <div class="wb-cap-grid">
        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--success);">已具备 (${a.capabilities.existing.length})</div>
          ${a.capabilities.existing.map(c => {
            const cap = ALL_CAPABILITIES.find(cc => cc.id === c);
            return `<span class="quest-status available">${cap ? cap.name : c}</span>`;
          }).join(' ')}
          ${!a.capabilities.existing.length ? '<span style="font-size:12px;color:var(--text-secondary);">无</span>' : ''}
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--danger);">缺失 (${a.capabilities.missing.length})</div>
          ${a.capabilities.missing.map(name => `<span class="quest-status missing">${name}</span>`).join(' ')}
          ${!a.capabilities.missing.length ? '<span style="font-size:12px;color:var(--text-secondary);">无</span>' : ''}
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="wb-actions">
      ${a.status !== '已部署' ?
        `<button class="btn btn-primary" data-deploy-id="${a.id}">一键部署到生产环境</button>` :
        `<button class="btn btn-secondary" disabled>已部署 (${new Date(a.deployedAt).toLocaleDateString('zh-CN')})</button>`}
    </div>
  </div>`;
}

function toggleDetail(id) {
  expandedCardId = expandedCardId === id ? null : id;
  renderCards(loadAnalyses());
}

function deleteAnalysis(id) {
  const analyses = loadAnalyses().filter(a => a.id !== id);
  saveAnalyses(analyses);
  if (expandedCardId === id) expandedCardId = null;
  showToast('分析记录已删除');
  renderCards(analyses);
}

/* ═══════════════════════════════════════
   部署
   ═══════════════════════════════════════ */
function showDeployConfirmation(id) {
  const analyses = loadAnalyses();
  const a = analyses.find(x => x.id === id);
  if (!a) return;

  const modal = document.getElementById('deployModal');
  const warnings = a.conflicts.filter(c => c.level === 'warning');
  document.getElementById('deployModalContent').innerHTML = `
    <div class="modal-header"><h3>确认部署分析结果</h3><button class="modal-close" id="closeDeployModal">&times;</button></div>
    <div class="modal-body">
      <p style="margin-bottom:16px;">即将部署「<strong>${a.matchedSkill.icon} ${a.matchedSkill.name}</strong>」的分析结果到生产环境：</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div class="rule-item"><span class="bullet" style="background:var(--primary)"></span>添加 <strong>${a.draftCases.length}</strong> 条案例到案例库</div>
        <div class="rule-item"><span class="bullet" style="background:#059669"></span>添加 <strong>${a.draftRules.length}</strong> 条策略规则到编辑器</div>
        <div class="rule-item"><span class="bullet" style="background:#D97706"></span>更新 Skill 数据 (+${a.conversationCount} 会话)</div>
      </div>
      ${warnings.length ? `<div class="conflict-alert" style="margin-bottom:8px;">\u26A0\uFE0F 存在 ${warnings.length} 个冲突项，部署后请手动检查</div>` : ''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="cancelDeploy">取消</button>
      <button class="btn btn-primary" id="confirmDeploy">确认部署</button>
    </div>`;
  modal.classList.add('show');

  document.getElementById('closeDeployModal').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('cancelDeploy').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('confirmDeploy').addEventListener('click', () => {
    modal.classList.remove('show');
    executeDeploy(id);
  });
}

function executeDeploy(id) {
  const analyses = loadAnalyses();
  const a = analyses.find(x => x.id === id);
  if (!a) return;

  // 1. 添加案例到 MOCK_CASES
  for (const c of a.draftCases) {
    c.id = 'c' + (MOCK_CASES.length + 1);
    MOCK_CASES.push(c);
    // 确保 label 颜色存在
    if (!CASE_LABEL_COLORS[c.label]) {
      CASE_LABEL_COLORS[c.label] = a.matchedSkill.color;
    }
  }

  // 2. 添加策略模板到 NL_TEMPLATES
  for (const r of a.draftRules) {
    NL_TEMPLATES.push({ name: r.name, text: r.text, result: r.result });
  }

  // 3. 更新 REAL_SKILLS
  const skill = REAL_SKILLS.find(s => s.id === a.matchedSkill.id);
  if (skill) {
    skill.primaryCount += a.conversationCount;
    const totalAll = REAL_SKILLS.reduce((sum, s) => sum + s.primaryCount, 0);
    REAL_SKILLS.forEach(s => { s.primaryPct = parseFloat((s.primaryCount / totalAll * 100).toFixed(1)); });
    for (const sub of a.subScenarios) {
      if (!skill.subScenarios.some(s => s.name === sub.name)) {
        skill.subScenarios.push({
          id: skill.id + '--' + sub.name,
          name: sub.name,
          status: 'draft',
          version: 'v0.1.0',
          ruleCount: 0,
          capabilities: [...skill.capabilities],
          primaryCount: 0,
          primaryPct: sub.pct || 0,
        });
      }
    }
    skill.ruleCount += a.draftRules.length;
  }

  // 4. 更新 ALL_CAPABILITIES
  for (const capId of a.capabilities.existing) {
    const cap = ALL_CAPABILITIES.find(c => c.id === capId);
    if (cap && !cap.skills.includes(a.matchedSkill.id)) {
      cap.skills.push(a.matchedSkill.id);
    }
  }

  // 5. 更新分析状态
  a.status = '已部署';
  a.deployedAt = Date.now();
  saveAnalyses(analyses);

  // 6. 刷新
  if (window.sscRefreshModules) window.sscRefreshModules();
  showToast(`「${a.matchedSkill.name}」分析结果已部署到生产环境`);
  renderCards(analyses);
}
