/**
 * 认证模块 - Skills 策略中心
 * localStorage 存储，SHA-256 密码哈希
 */

const USERS_KEY = 'ssc_users';
const SESSION_KEY = 'ssc_session';

/* ── 密码哈希 ── */
export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── 用户数据 ── */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ── 注册 ── */
export async function register({ email, password, name }) {
  email = (email || '').toLowerCase().trim();
  name = (name || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: '请输入有效的邮箱地址' };
  if (!name || name.length < 2) return { ok: false, error: '用户名至少 2 个字符' };
  if (!password || password.length < 6) return { ok: false, error: '密码至少 6 个字符' };

  const users = getUsers();
  if (users.find(u => u.email === email)) return { ok: false, error: '该邮箱已注册' };

  const user = {
    email,
    name,
    passwordHash: await hashPassword(password),
    avatar: name.charAt(0).toUpperCase(),
    createdAt: Date.now()
  };
  users.push(user);
  saveUsers(users);
  createSession(user);
  return { ok: true };
}

/* ── 登录 ── */
export async function login({ email, password }) {
  email = (email || '').toLowerCase().trim();
  if (!email || !password) return { ok: false, error: '请填写邮箱和密码' };

  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return { ok: false, error: '邮箱或密码错误' };

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, error: '邮箱或密码错误' };

  createSession(user);
  return { ok: true };
}

/* ── 会话管理 ── */
function createSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    loginAt: Date.now()
  }));
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

export function requireAuth() {
  if (!getSession()) {
    window.location.replace('login.html');
    throw new Error('redirect');
  }
}

/* ── 密码强度 ── */
export function evaluatePasswordStrength(pw) {
  if (!pw || pw.length < 6) return { level: 0, label: '弱', color: '#DC2626' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length >= 12 && score >= 3) return { level: 3, label: '极强', color: '#059669' };
  if (score >= 2) return { level: 2, label: '强', color: '#4F46E5' };
  if (score >= 1) return { level: 1, label: '中', color: '#D97706' };
  return { level: 0, label: '弱', color: '#DC2626' };
}

/* ── 转义 HTML ── */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ── 导航栏用户菜单 ── */
export function renderUserMenu(container) {
  const s = getSession();
  if (!s || !container) return;

  container.innerHTML = `
    <button class="nav-user-btn" id="userMenuBtn">
      <span class="nav-user-avatar">${esc(s.avatar)}</span>
      <span class="nav-user-name">${esc(s.name)}</span>
    </button>
    <div class="nav-user-dropdown" id="userDropdown">
      <div class="nav-user-info">
        <div class="nav-user-avatar avatar-lg">${esc(s.avatar)}</div>
        <div class="nav-user-info-name">${esc(s.name)}</div>
        <div class="nav-user-info-email">${esc(s.email)}</div>
      </div>
      <div class="nav-user-divider"></div>
      <button class="nav-user-option danger" id="logoutBtn">退出登录</button>
    </div>`;

  const btn = document.getElementById('userMenuBtn');
  const dd = document.getElementById('userDropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dd.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-user')) dd.classList.remove('show');
  });

  document.getElementById('logoutBtn').addEventListener('click', logout);
}
