/* ============================================================
   LIFE DASHBOARD — js/app.js
   Vanilla JS · localStorage · No frameworks
   ============================================================ */

'use strict';

/* ── STORAGE HELPERS ─────────────────────────────────────────*/
const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ── QUOTES ──────────────────────────────────────────────────*/
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Thoreau" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Small steps in the right direction can turn out to be the biggest step of your life.", author: "Naeem Callaway" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
];

/* ── STATE ───────────────────────────────────────────────────*/
let tasks      = store.get('ld_tasks',   []);
let habits     = store.get('ld_habits',  []);
let goals      = store.get('ld_goals',   []);
let links      = store.get('ld_links',   []);
let mood       = store.get('ld_mood',    { value: null, date: null });
let focus      = store.get('ld_focus',   { text: '', date: null });
let history    = store.get('ld_history', {});
let quoteIndex = store.get('ld_quote_idx', 0);
let taskFilter = 'all';   // all | active | done
let catFilter  = 'all';   // all | personal | work | health | learning
let sortOrder  = store.get('ld_sort', 'newest');

const TODAY = new Date().toISOString().slice(0, 10);

/* Reset daily fields */
if (mood.date  !== TODAY) mood  = { value: null, date: TODAY };
if (focus.date !== TODAY) focus = { text: '', date: TODAY };

/* Reset habit daily-checked state */
habits = habits.map(h => ({
  ...h,
  checkedToday: h.lastChecked === TODAY ? h.checkedToday : false,
  lastChecked:  h.lastChecked === TODAY ? h.lastChecked  : null
}));

/* ── UTILS ───────────────────────────────────────────────────*/
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ════════════════════════════════════════════════════════════
   THEME — Light / Dark
════════════════════════════════════════════════════════════ */
let currentTheme = store.get('ld_theme', 'dark');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

applyTheme(currentTheme);

document.getElementById('theme-toggle').addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  store.set('ld_theme', currentTheme);
  applyTheme(currentTheme);
  toast(currentTheme === 'light' ? '☀️ Light mode' : '🌙 Dark mode');
});

/* ════════════════════════════════════════════════════════════
   CUSTOM NAME + GREETING
════════════════════════════════════════════════════════════ */
let userName = store.get('ld_username', '');

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

function renderGreeting() {
  const greet = getGreeting();
  document.getElementById('greeting-text').textContent =
    userName ? `${greet}, ${userName}! 👋` : `${greet}! 👋`;
  document.getElementById('greeting-name').textContent =
    userName ? '' : 'Set your name to personalise your dashboard →';
}

renderGreeting();

/* Name modal */
const nameModal     = document.getElementById('name-modal');
const nameInput     = document.getElementById('name-input');

document.getElementById('set-name-btn').addEventListener('click', () => {
  nameInput.value = userName;
  nameModal.classList.remove('hidden');
  nameInput.focus();
});

document.getElementById('name-save-btn').addEventListener('click', saveName);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });

document.getElementById('name-cancel-btn').addEventListener('click', () => {
  nameModal.classList.add('hidden');
});

nameModal.addEventListener('click', e => {
  if (e.target === nameModal) nameModal.classList.add('hidden');
});

function saveName() {
  const val = nameInput.value.trim();
  userName = val;
  store.set('ld_username', val);
  nameModal.classList.add('hidden');
  renderGreeting();
  toast(val ? `Hi, ${val}! 👋` : 'Name cleared');
}

/* ════════════════════════════════════════════════════════════
   DATE / TIME CLOCK
════════════════════════════════════════════════════════════ */
function updateClock() {
  const now  = new Date();
  const date = now.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const time = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  document.getElementById('datetime').textContent = `${date}  ·  ${time}`;
  // refresh greeting in case midnight crossed
  renderGreeting();
}
updateClock();
setInterval(updateClock, 10000);

/* ════════════════════════════════════════════════════════════
   HEADER PROGRESS BAR
════════════════════════════════════════════════════════════ */
function updateHeaderProgress() {
  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('summary-text').textContent =
    `${done} of ${total} task${total !== 1 ? 's' : ''} done`;
  document.getElementById('mini-progress-bar').style.width = pct + '%';
}

/* ════════════════════════════════════════════════════════════
   FOCUS TIMER (25-min Pomodoro)
════════════════════════════════════════════════════════════ */
let timerDuration = 25 * 60; // seconds
let timerLeft     = timerDuration;
let timerInterval = null;
let timerRunning  = false;

const timerDisplay = document.getElementById('timer-display');
const timerLabel   = document.getElementById('timer-label');

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerLeft);
  if (timerRunning) {
    timerDisplay.className = 'timer-display running';
    timerLabel.textContent = 'Stay focused…';
  } else if (timerLeft === 0) {
    timerDisplay.className = 'timer-display done';
    timerLabel.textContent = '🎉 Session complete!';
  } else if (timerLeft === timerDuration) {
    timerDisplay.className = 'timer-display';
    timerLabel.textContent = 'Ready to focus';
  } else {
    timerDisplay.className = 'timer-display';
    timerLabel.textContent = 'Paused';
  }
}

function startTimer() {
  if (timerRunning) return;
  if (timerLeft === 0) timerLeft = timerDuration; // auto-reset if done
  timerRunning = true;
  renderTimer();
  timerInterval = setInterval(() => {
    timerLeft--;
    renderTimer();
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerLeft = 0;
      renderTimer();
      toast('⏰ Focus session complete! Take a break.');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  renderTimer();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerLeft = timerDuration;
  renderTimer();
}

document.getElementById('timer-start-btn').addEventListener('click', startTimer);
document.getElementById('timer-stop-btn').addEventListener('click', stopTimer);
document.getElementById('timer-reset-btn').addEventListener('click', resetTimer);

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const min = parseInt(btn.dataset.min, 10);
    timerDuration = min * 60;
    stopTimer();
    timerLeft = timerDuration;
    renderTimer();
  });
});

renderTimer();

/* ════════════════════════════════════════════════════════════
   MOOD
════════════════════════════════════════════════════════════ */
const MOOD_LABELS = {
  amazing:  '🤩 Feeling amazing today!',
  happy:    '😊 Having a great day!',
  neutral:  '😐 Just a normal day.',
  tired:    '😴 A bit low on energy.',
  sad:      '😢 Not the best day.',
  stressed: '😤 Feeling stressed — take a breath.'
};

function renderMood() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mood === mood.value);
  });
  document.getElementById('mood-label').textContent =
    mood.value ? MOOD_LABELS[mood.value] : 'Pick a mood to log your day';
}

document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    mood = { value: btn.dataset.mood, date: TODAY };
    store.set('ld_mood', mood);
    renderMood();
    toast('Mood logged ' + btn.textContent);
  });
});

renderMood();

/* ════════════════════════════════════════════════════════════
   DAILY QUOTE
════════════════════════════════════════════════════════════ */
function renderQuote() {
  const q = QUOTES[quoteIndex % QUOTES.length];
  document.getElementById('quote-text').textContent   = `"${q.text}"`;
  document.getElementById('quote-author').textContent = `— ${q.author}`;
}

document.getElementById('new-quote-btn').addEventListener('click', () => {
  quoteIndex = (quoteIndex + 1) % QUOTES.length;
  store.set('ld_quote_idx', quoteIndex);
  renderQuote();
});

renderQuote();

/* ════════════════════════════════════════════════════════════
   TODAY'S FOCUS (text)
════════════════════════════════════════════════════════════ */
const focusInput    = document.getElementById('focus-input');
const focusDisplay  = document.getElementById('focus-display');
const focusEditBtn  = document.getElementById('focus-edit-btn');
const focusWrap     = focusInput.parentElement;

function renderFocus() {
  if (focus.text) {
    focusWrap.classList.add('hidden');
    focusDisplay.textContent = focus.text;
    focusDisplay.classList.remove('hidden');
    focusEditBtn.classList.remove('hidden');
  } else {
    focusWrap.classList.remove('hidden');
    focusDisplay.classList.add('hidden');
    focusEditBtn.classList.add('hidden');
    focusInput.value = '';
  }
}

document.getElementById('focus-save-btn').addEventListener('click', saveFocus);
focusInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveFocus(); });
focusEditBtn.addEventListener('click', () => {
  focusInput.value = focus.text;
  focus.text = '';
  renderFocus();
  focusInput.focus();
});

function saveFocus() {
  const val = focusInput.value.trim();
  if (!val) return;
  focus = { text: val, date: TODAY };
  store.set('ld_focus', focus);
  renderFocus();
  toast('Focus set!');
}

renderFocus();

/* ════════════════════════════════════════════════════════════
   HABITS
════════════════════════════════════════════════════════════ */
function saveHabits() { store.set('ld_habits', habits); }

function renderHabits() {
  const list = document.getElementById('habit-list');
  if (!habits.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div>Add a daily habit</div>';
    updateStats();
    return;
  }
  list.innerHTML = habits.map(h => `
    <li class="habit-item ${h.checkedToday ? 'done' : ''}" data-id="${h.id}">
      <div class="habit-check ${h.checkedToday ? 'checked' : ''}" data-action="check"></div>
      <span class="habit-name">${escHtml(h.name)}</span>
      <span class="habit-streak">${h.streak > 0 ? '🔥 ' + h.streak : ''}</span>
      <button class="habit-delete" data-action="delete" aria-label="Delete habit">✕</button>
    </li>
  `).join('');
  updateStats();
}

document.getElementById('habit-list').addEventListener('click', e => {
  const li     = e.target.closest('.habit-item');
  if (!li) return;
  const id     = li.dataset.id;
  const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
  const h      = habits.find(x => x.id === id);
  if (!h) return;

  if (action === 'check') {
    if (!h.checkedToday) {
      h.checkedToday = true;
      h.lastChecked  = TODAY;
      h.streak       = (h.streak || 0) + 1;
    } else {
      h.checkedToday = false;
      h.streak       = Math.max(0, (h.streak || 1) - 1);
    }
    saveHabits();
    renderHabits();
  }
  if (action === 'delete') {
    habits = habits.filter(x => x.id !== id);
    saveHabits();
    renderHabits();
    toast('Habit removed');
  }
});

document.getElementById('add-habit-btn').addEventListener('click', () => {
  const form = document.getElementById('habit-form');
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) document.getElementById('habit-input').focus();
});
document.getElementById('habit-save-btn').addEventListener('click', addHabit);
document.getElementById('habit-input').addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });
document.getElementById('habit-cancel-btn').addEventListener('click', () => {
  document.getElementById('habit-form').classList.add('hidden');
  document.getElementById('habit-input').value = '';
});

function addHabit() {
  const input = document.getElementById('habit-input');
  const name  = input.value.trim();
  if (!name) return;
  habits.push({ id: uid(), name, checkedToday: false, streak: 0, lastChecked: null });
  saveHabits();
  input.value = '';
  document.getElementById('habit-form').classList.add('hidden');
  renderHabits();
  toast('Habit added!');
}

renderHabits();

/* ════════════════════════════════════════════════════════════
   TASKS — Add · Edit · Delete · Mark Done · Filter · Sort
════════════════════════════════════════════════════════════ */
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function saveTasks() {
  store.set('ld_tasks', tasks);
  const done = tasks.filter(t => t.done).length;
  history[TODAY] = done;
  store.set('ld_history', history);
}

function getSortedFilteredTasks() {
  let list = tasks.filter(t => {
    const statusOk = taskFilter === 'all' || (taskFilter === 'done' ? t.done : !t.done);
    const catOk    = catFilter  === 'all' || t.category === catFilter;
    return statusOk && catOk;
  });

  switch (sortOrder) {
    case 'oldest':   list = [...list].sort((a, b) => a.created - b.created);                          break;
    case 'newest':   list = [...list].sort((a, b) => b.created - a.created);                          break;
    case 'priority': list = [...list].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]); break;
    case 'az':       list = [...list].sort((a, b) => a.text.localeCompare(b.text));                   break;
    case 'za':       list = [...list].sort((a, b) => b.text.localeCompare(a.text));                   break;
  }
  return list;
}

function renderTasks() {
  const list     = document.getElementById('task-list');
  const filtered = getSortedFilteredTasks();
  const left     = tasks.filter(t => !t.done).length;

  document.getElementById('tasks-left').textContent =
    left ? `${left} task${left !== 1 ? 's' : ''} remaining` : 'All done 🎉';

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${taskFilter === 'done' ? '✅' : '📋'}</div>
        ${taskFilter === 'done' ? 'No completed tasks yet' : 'No tasks here — add one above!'}
      </div>`;
    updateHeaderProgress();
    updateStats();
    return;
  }

  list.innerHTML = filtered.map(t => `
    <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="task-checkbox ${t.done ? 'checked' : ''}" data-action="toggle" aria-label="Toggle task"></div>
      <div class="task-body">
        <div class="task-text">${escHtml(t.text)}</div>
        <div class="task-meta">
          <span class="task-cat cat-${t.category}">${t.category}</span>
          <span class="task-priority priority-${t.priority}">${t.priority}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-edit"   data-action="edit"   aria-label="Edit task"   title="Edit">✏️</button>
        <button class="task-delete" data-action="delete" aria-label="Delete task" title="Delete">✕</button>
      </div>
    </li>
  `).join('');

  updateHeaderProgress();
  updateStats();
}

/* Task list click handler */
document.getElementById('task-list').addEventListener('click', e => {
  const li     = e.target.closest('.task-item');
  if (!li) return;
  const id     = li.dataset.id;
  const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;

  if (action === 'toggle') {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    if (t.done) toast('Task complete ✓');
    saveTasks();
    renderTasks();
  }

  if (action === 'edit') {
    openInlineEdit(li, id);
  }

  if (action === 'delete') {
    tasks = tasks.filter(x => x.id !== id);
    saveTasks();
    renderTasks();
    toast('Task deleted');
  }

  /* inline edit save / cancel */
  if (action === 'edit-save') {
    const input = li.querySelector('.task-edit-input');
    const newText = input.value.trim();
    if (!newText) return;
    const t = tasks.find(x => x.id === id);
    if (t) { t.text = newText; saveTasks(); renderTasks(); toast('Task updated'); }
  }
  if (action === 'edit-cancel') {
    renderTasks(); // just re-render to close
  }
});

function openInlineEdit(li, id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  // Replace task text with an input
  const body = li.querySelector('.task-body');
  body.innerHTML = `
    <div class="task-edit-wrap">
      <input class="task-edit-input" type="text" value="${escHtml(t.text)}" maxlength="100" aria-label="Edit task text" />
      <button class="task-edit-save"   data-action="edit-save"   title="Save">✓</button>
      <button class="task-edit-cancel" data-action="edit-cancel" title="Cancel">✕</button>
    </div>
  `;
  const input = li.querySelector('.task-edit-input');
  input.focus();
  input.select();

  // Save on Enter, cancel on Escape
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const newText = input.value.trim();
      if (!newText) return;
      t.text = newText;
      saveTasks();
      renderTasks();
      toast('Task updated');
    }
    if (e.key === 'Escape') renderTasks();
  });
}

/* Add task */
document.getElementById('task-add-btn').addEventListener('click', addTask);
document.getElementById('task-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

function addTask() {
  const input   = document.getElementById('task-input');
  const catSel  = document.getElementById('task-cat-select');
  const priSel  = document.getElementById('task-priority-select');
  const text    = input.value.trim();
  if (!text) { input.focus(); return; }
  tasks.push({ id: uid(), text, done: false, category: catSel.value, priority: priSel.value, created: Date.now() });
  input.value = '';
  saveTasks();
  renderTasks();
  toast('Task added!');
}

/* Status filters */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    taskFilter = btn.dataset.filter;
    renderTasks();
  });
});

/* Category tabs */
document.querySelectorAll('.cat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    tab.classList.add('active');
    catFilter = tab.dataset.cat;
    renderTasks();
  });
});

/* Sort dropdown */
const sortSelect = document.getElementById('sort-select');
sortSelect.value = sortOrder;
sortSelect.addEventListener('change', () => {
  sortOrder = sortSelect.value;
  store.set('ld_sort', sortOrder);
  renderTasks();
});

/* Clear done */
document.getElementById('clear-done-btn').addEventListener('click', () => {
  const count = tasks.filter(t => t.done).length;
  if (!count) { toast('No completed tasks to clear'); return; }
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  renderTasks();
  toast(`Cleared ${count} completed task${count !== 1 ? 's' : ''}`);
});

renderTasks();

/* ════════════════════════════════════════════════════════════
   QUICK LINKS — saved in localStorage
════════════════════════════════════════════════════════════ */
function saveLinks() { store.set('ld_links', links); }

function renderLinks() {
  const grid = document.getElementById('links-grid');
  if (!links.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔗</div>Add your favourite sites</div>';
    return;
  }
  grid.innerHTML = links.map(l => `
    <a class="link-btn" href="${escHtml(l.url)}" target="_blank" rel="noopener noreferrer" data-id="${l.id}">
      <span class="link-emoji">${escHtml(l.emoji || '🌐')}</span>
      <span class="link-label">${escHtml(l.name)}</span>
      <button class="link-remove" data-action="remove-link" aria-label="Remove link" title="Remove">✕</button>
    </a>
  `).join('');
}

document.getElementById('links-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-action="remove-link"]');
  if (!btn) return;
  e.preventDefault();
  const card = btn.closest('[data-id]');
  if (!card) return;
  links = links.filter(l => l.id !== card.dataset.id);
  saveLinks();
  renderLinks();
  toast('Link removed');
});

document.getElementById('add-link-btn').addEventListener('click', () => {
  const form = document.getElementById('link-form');
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) document.getElementById('link-name').focus();
});

document.getElementById('link-save-btn').addEventListener('click', addLink);
document.getElementById('link-name').addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });
document.getElementById('link-cancel-btn').addEventListener('click', () => {
  document.getElementById('link-form').classList.add('hidden');
  ['link-name','link-url','link-emoji'].forEach(id => { document.getElementById(id).value = ''; });
});

function addLink() {
  const name  = document.getElementById('link-name').value.trim();
  const url   = document.getElementById('link-url').value.trim();
  const emoji = document.getElementById('link-emoji').value.trim();
  if (!name || !url) { toast('Please enter a label and URL'); return; }

  /* Basic URL validation */
  let safeUrl = url;
  if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;

  links.push({ id: uid(), name, url: safeUrl, emoji: emoji || '🌐' });
  saveLinks();
  ['link-name','link-url','link-emoji'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('link-form').classList.add('hidden');
  renderLinks();
  toast('Link added!');
}

renderLinks();

/* ════════════════════════════════════════════════════════════
   GOALS
════════════════════════════════════════════════════════════ */
function saveGoals() { store.set('ld_goals', goals); }

function renderGoals() {
  const list = document.getElementById('goal-list');
  if (!goals.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div>Add a goal to track</div>';
    return;
  }
  list.innerHTML = goals.map(g => {
    const pct  = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
    const done = g.current >= g.target;
    return `
    <li class="goal-item" data-id="${g.id}">
      <div class="goal-header">
        <span class="goal-name">${escHtml(g.name)}${done ? ' 🏆' : ''}</span>
        <button class="goal-delete" data-action="delete" aria-label="Delete goal">✕</button>
      </div>
      <div class="goal-progress-track">
        <div class="goal-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="goal-controls">
        <button class="goal-minus" data-action="minus" aria-label="Decrease">−</button>
        <button class="goal-plus"  data-action="plus"  aria-label="Increase">+</button>
        <span class="goal-progress-text">${g.current} / ${g.target} ${escHtml(g.unit)} (${pct}%)</span>
      </div>
    </li>`;
  }).join('');
}

document.getElementById('goal-list').addEventListener('click', e => {
  const li     = e.target.closest('.goal-item');
  if (!li) return;
  const id     = li.dataset.id;
  const action = e.target.dataset.action;
  const g      = goals.find(x => x.id === id);
  if (!g) return;

  if (action === 'plus')   { g.current = Math.min(g.target, g.current + 1); saveGoals(); renderGoals(); if (g.current >= g.target) toast('Goal reached! 🏆'); }
  if (action === 'minus')  { g.current = Math.max(0, g.current - 1);        saveGoals(); renderGoals(); }
  if (action === 'delete') { goals = goals.filter(x => x.id !== id); saveGoals(); renderGoals(); toast('Goal removed'); }
});

document.getElementById('add-goal-btn').addEventListener('click', () => {
  const form = document.getElementById('goal-form');
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) document.getElementById('goal-input').focus();
});
document.getElementById('goal-save-btn').addEventListener('click', addGoal);
document.getElementById('goal-cancel-btn').addEventListener('click', () => {
  document.getElementById('goal-form').classList.add('hidden');
  ['goal-input','goal-target','goal-unit'].forEach(id => { document.getElementById(id).value = ''; });
});

function addGoal() {
  const name   = document.getElementById('goal-input').value.trim();
  const target = parseInt(document.getElementById('goal-target').value, 10);
  const unit   = document.getElementById('goal-unit').value.trim() || 'items';
  if (!name || !target || target < 1) { toast('Please fill goal name and target'); return; }
  goals.push({ id: uid(), name, target, unit, current: 0 });
  saveGoals();
  ['goal-input','goal-target','goal-unit'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('goal-form').classList.add('hidden');
  renderGoals();
  toast('Goal added!');
}

renderGoals();

/* ════════════════════════════════════════════════════════════
   NOTES (auto-save)
════════════════════════════════════════════════════════════ */
const notesArea  = document.getElementById('notes-area');
const notesSaved = document.getElementById('notes-saved');
const charCount  = document.getElementById('char-count');
const MAX_NOTES  = 500;

notesArea.value = store.get('ld_notes', '');
charCount.textContent = `${notesArea.value.length} / ${MAX_NOTES}`;

let notesSaveTimer;
notesArea.addEventListener('input', () => {
  if (notesArea.value.length > MAX_NOTES) notesArea.value = notesArea.value.slice(0, MAX_NOTES);
  charCount.textContent = `${notesArea.value.length} / ${MAX_NOTES}`;
  notesSaved.textContent = '';
  notesSaved.classList.remove('visible');
  clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(() => {
    store.set('ld_notes', notesArea.value);
    notesSaved.textContent = 'Saved';
    notesSaved.classList.add('visible');
    setTimeout(() => { notesSaved.textContent = ''; notesSaved.classList.remove('visible'); }, 1500);
  }, 700);
});

/* ════════════════════════════════════════════════════════════
   STATS + WEEKLY BAR
════════════════════════════════════════════════════════════ */
function calcStreak() {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (history[key] && history[key] > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      d.setDate(d.getDate() - 1); // today might be 0, check yesterday
    } else {
      break;
    }
  }
  return streak;
}

function updateStats() {
  document.getElementById('stat-total').textContent  = tasks.length;
  document.getElementById('stat-done').textContent   = tasks.filter(t => t.done).length;
  document.getElementById('stat-streak').textContent = calcStreak();
  document.getElementById('stat-habits').textContent =
    `${habits.filter(h => h.checkedToday).length}/${habits.length}`;
  renderWeeklyBar();
}

function renderWeeklyBar() {
  const bar  = document.getElementById('weekly-bar');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const data = [];
  const now  = new Date();
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    data.push({ day: days[d.getDay()], count: history[key] || 0, isToday: i === 0 });
  }
  const maxVal = Math.max(...data.map(x => x.count), 1);
  bar.innerHTML = data.map(x => `
    <div class="week-col">
      <div class="week-bar-fill ${x.isToday ? 'today' : ''}"
           style="height:${Math.max(4, Math.round((x.count / maxVal) * 42))}px"
           title="${x.count} task${x.count !== 1 ? 's' : ''}"></div>
      <div class="week-day-label">${x.day}</div>
    </div>
  `).join('');
}

updateStats();
updateHeaderProgress();
