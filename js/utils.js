/**
 * 通用工具函数
 */

// Toast 提示
export function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.className = 'toast ' + type;
  t.textContent = (type === 'success' ? '\u2705' : '\u26A0\uFE0F') + ' ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// 数字动画
export function animateCounter(el, target, suffix = '') {
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current.toLocaleString() + suffix;
  }, 30);
}

// 文本截断
export function truncText(str, max) {
  return !str ? '' : str.length > max ? str.slice(0, max) + '...' : str;
}
