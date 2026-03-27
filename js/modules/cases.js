/**
 * 案例库模块
 * 关联：MOCK_CASES → 点击可跳转策略编辑器创建策略
 */
import { MOCK_CASES, CASE_LABEL_COLORS } from '../data/cases.js';

let currentFilterFn = null;

export function renderCases(onCreateStrategy) {
  const labels = [...new Set(MOCK_CASES.map(c => c.label))];
  let html = `
    <h1 class="section-title">案例库</h1>
    <p class="section-desc">基于真实信保纠纷对话提取的案例知识库（${MOCK_CASES.length}条真实工单数据）</p>
    <div class="filter-bar">
      <input type="text" id="caseSearch" placeholder="搜索客户诉求、解决方案、订单号...">
      <select id="caseCategory"><option value="">全部场景</option>${labels.map(l => `<option>${l}</option>`).join('')}</select>
      <select id="caseCsat"><option value="">全部评分</option><option value="high">\u2265 4.0</option><option value="mid">3.0 - 4.0</option><option value="low">< 3.0</option></select>
    </div>
    <div class="case-list">
      <div class="case-header"><div>场景</div><div>客户诉求</div><div>解决方案</div><div>CSAT</div><div>日期</div><div>操作</div></div>
      <div id="caseRows"></div>
    </div>`;
  document.getElementById('sec-cases').innerHTML = html;

  // 绑定筛选事件
  const doFilter = () => filterCases(onCreateStrategy);
  document.getElementById('caseSearch').addEventListener('input', doFilter);
  document.getElementById('caseCategory').addEventListener('change', doFilter);
  document.getElementById('caseCsat').addEventListener('change', doFilter);
  filterCases(onCreateStrategy);
}

function filterCases(onCreateStrategy) {
  const q = (document.getElementById('caseSearch').value || '').toLowerCase();
  const cat = document.getElementById('caseCategory').value;
  const csatF = document.getElementById('caseCsat').value;

  const filtered = MOCK_CASES.filter(c => {
    if (q && !c.customerDemand.toLowerCase().includes(q) && !c.resolution.toLowerCase().includes(q) && !(c.orderNo || '').toLowerCase().includes(q)) return false;
    if (cat && c.label !== cat) return false;
    if (csatF === 'high' && c.csat < 4.0) return false;
    if (csatF === 'mid' && (c.csat < 3.0 || c.csat >= 4.0)) return false;
    if (csatF === 'low' && c.csat >= 3.0) return false;
    return true;
  });

  const rowsEl = document.getElementById('caseRows');
  rowsEl.innerHTML = filtered.map(c => {
    const csatCls = c.csat >= 4.0 ? 'csat-high' : c.csat >= 3.0 ? 'csat-mid' : 'csat-low';
    const bgColor = CASE_LABEL_COLORS[c.label] || '#6366F1';
    return `<div class="case-row" data-case-id="${c.id}">
      <div><span class="case-tag" style="background:${bgColor}15;color:${bgColor}">${c.label}</span></div>
      <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.customerDemand}</div>
      <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-secondary);">${c.resolution}</div>
      <div class="${csatCls}" style="font-weight:600;">${c.csat}</div>
      <div style="color:var(--text-secondary);font-size:12px;">${c.date}</div>
      <div><button class="btn btn-secondary" style="padding:4px 10px;font-size:11px;" data-detail-id="${c.id}">详情</button></div>
    </div>`;
  }).join('') || '<div class="empty-state">未找到匹配的案例</div>';

  // 绑定行点击和详情按钮
  rowsEl.querySelectorAll('.case-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('[data-detail-id]')) return;
      showCaseDetail(row.dataset.caseId, onCreateStrategy);
    });
  });
  rowsEl.querySelectorAll('[data-detail-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showCaseDetail(btn.dataset.detailId, onCreateStrategy);
    });
  });
}

function showCaseDetail(id, onCreateStrategy) {
  const c = MOCK_CASES.find(x => x.id === id);
  if (!c) return;
  const bgColor = CASE_LABEL_COLORS[c.label] || '#6366F1';
  const modal = document.getElementById('caseModal');
  document.getElementById('caseModalContent').innerHTML = `
    <div class="modal-header"><h3>案例详情</h3><button class="modal-close" id="closeCaseModal">&times;</button></div>
    <div class="modal-body">
      <div class="modal-field"><div class="field-label">场景分类</div><div class="field-value">${c.scenario.map(s => `<span class="modal-tag" style="background:${bgColor}15;color:${bgColor}">${s}</span>`).join(' \u2192 ')}</div></div>
      <div class="modal-field"><div class="field-label">订单号</div><div class="field-value" style="font-family:monospace;color:var(--primary);">${c.orderNo || 'N/A'}</div></div>
      <div class="modal-field"><div class="field-label">客户诉求</div><div class="field-value">${c.customerDemand}</div></div>
      <div class="modal-field"><div class="field-label">解决方案</div><div class="field-value">${c.resolution}</div></div>
      <div class="modal-field"><div class="field-label">CSAT 评分</div><div class="field-value" style="font-weight:600;color:${c.csat >= 4 ? '#059669' : c.csat >= 3 ? '#D97706' : '#DC2626'}">${c.csat} / 5.0</div></div>
      <div class="modal-field"><div class="field-label">处理日期</div><div class="field-value">${c.date}</div></div>
      <div class="modal-field"><div class="field-label">处理客服</div><div class="field-value">${c.csAgent || 'N/A'}</div></div>
      <div class="modal-field"><div class="field-label">关联 SOP</div><div class="field-value"><span class="modal-tag" style="background:#EEF2FF;color:#4F46E5">${c.sopRef}</span></div></div>
      <div class="modal-field"><div class="field-label">情绪轨迹</div><div class="field-value">${c.emotion.join(' \u2192 ')}</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="closeCaseModalBtn">关闭</button>
      <button class="btn btn-primary" id="createFromCase">基于此案例创建策略</button>
    </div>`;
  modal.classList.add('show');

  document.getElementById('closeCaseModal').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('closeCaseModalBtn').addEventListener('click', () => modal.classList.remove('show'));
  document.getElementById('createFromCase').addEventListener('click', () => {
    modal.classList.remove('show');
    if (onCreateStrategy) onCreateStrategy();
  });
}
