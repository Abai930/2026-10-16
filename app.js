(() => {
  const dateElement = document.getElementById('today-date');
  const scheduleList = document.getElementById('schedule-list');
  const scheduleCount = document.getElementById('schedule-count');
  const todoList = document.getElementById('todo-list');
  const todoCount = document.getElementById('todo-count');
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const clearCompletedButton = document.getElementById('clear-completed');
  const dailyTip = document.getElementById('daily-tip');
  const form = document.getElementById('schedule-form');
  const scheduleStorageKey = 'daily-list-schedules-v1';
  const todoStorageKey = 'daily-list-todos-v1';
  const titleInput = document.getElementById('event-title');
  const timeInput = document.getElementById('event-time');
  const message = document.getElementById('form-message');
  const locale = 'zh-TW';

  dateElement.textContent = new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).format(new Date());

  function loadStoredList(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  function saveStoredList(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      const storageNote = document.getElementById('storage-note');
      storageNote.textContent = '目前無法儲存資料，請檢查瀏覽器儲存設定';
    }
  }

  function updateTodoStatus(item) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const status = item.querySelector('.todo-status');
    status.textContent = checkbox.checked ? '已完成' : '待完成';
    status.classList.toggle('status-done', checkbox.checked);
    status.classList.toggle('status-pending', !checkbox.checked);
  }

  function getTodoItems() {
    return [...todoList.querySelectorAll('.todo-item')].map(item => ({
      text: item.querySelector('.todo-text').textContent,
      done: item.querySelector('input[type="checkbox"]').checked
    }));
  }

  function saveTodos() {
    saveStoredList(todoStorageKey, getTodoItems());
  }

  function createTodoItem(text, done = false) {
    const item = document.createElement('li');
    item.className = 'todo-item';
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = done;
    const checkMark = document.createElement('span');
    checkMark.className = 'custom-check';
    checkMark.setAttribute('aria-hidden', 'true');
    const todoText = document.createElement('span');
    todoText.className = 'todo-text';
    todoText.textContent = text;
    const status = document.createElement('span');
    status.className = 'todo-status';
    label.append(checkbox, checkMark, todoText);
    item.append(label, status);
    updateTodoStatus(item);
    return item;
  }

  function renderStoredTodos() {
    const storedTodos = loadStoredList(todoStorageKey);
    if (!Array.isArray(storedTodos)) return;
    todoList.replaceChildren();
    storedTodos.filter(todo => todo && typeof todo.text === 'string').forEach(todo => {
      todoList.append(createTodoItem(todo.text, Boolean(todo.done)));
    });
  }

  function updateTodoCount() {
    const items = [...todoList.querySelectorAll('.todo-item')];
    const completed = items.filter(item => item.querySelector('input').checked).length;
    todoCount.textContent = `${completed} / ${items.length}`;
  }

  renderStoredTodos();
  todoList.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]')) return;
    const item = event.target.closest('.todo-item');
    updateTodoStatus(item);
    updateTodoCount();
    saveTodos();
  });
  todoForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    todoList.append(createTodoItem(text));
    todoInput.value = '';
    updateTodoCount();
    saveTodos();
    todoInput.focus();
  });
  clearCompletedButton.addEventListener('click', () => {
    todoList.querySelectorAll('.todo-item input:checked').forEach(checkbox => checkbox.closest('.todo-item').remove());
    updateTodoCount();
    saveTodos();
  });
  updateTodoCount();

  const dailyTips = [
    '今天也記得喝杯水，照顧好自己。',
    '不用一次完成所有事，先做一小步就好。',
    '留五分鐘伸展一下，讓肩膀放個假。',
    '出門前看看天氣，記得帶上需要的東西。',
    '忙裡偷閒，站起來走走、看看窗外。',
    '今天有好好吃飯嗎？別忘了照顧自己。',
    '完成一件小事，也值得為自己拍拍手。'
  ];
  const dayNumber = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  dailyTip.lastChild.textContent = ` ${dailyTips[((dayNumber % dailyTips.length) + dailyTips.length) % dailyTips.length]}`;

  function getScheduleItems() {
    return [...scheduleList.querySelectorAll('.schedule-item')].map(item => ({
      time: item.querySelector('time').dateTime,
      title: item.querySelector('.schedule-details h3').textContent,
      description: item.querySelector('.schedule-details p')?.textContent || '',
      tag: item.querySelector('.schedule-tag').textContent,
      tone: ['dot-lavender', 'dot-peach', 'dot-green'].find(name => item.querySelector('.timeline-dot').classList.contains(name)) || 'dot-green'
    }));
  }

  function renderScheduleItem(entry) {
    const item = document.createElement('article');
    item.className = 'schedule-item';
    const timeElement = document.createElement('time');
    timeElement.className = 'schedule-time';
    timeElement.dateTime = entry.time;
    timeElement.textContent = formatTime(entry.time);
    const dot = document.createElement('span');
    dot.className = `timeline-dot ${entry.tone || 'dot-green'}`;
    dot.setAttribute('aria-hidden', 'true');
    const details = document.createElement('div');
    details.className = 'schedule-details';
    const heading = document.createElement('h3');
    heading.textContent = entry.title;
    details.append(heading);
    if (entry.description) {
      const description = document.createElement('p');
      description.textContent = entry.description;
      details.append(description);
    }
    const tag = document.createElement('span');
    tag.className = 'schedule-tag tag-green';
    tag.textContent = entry.tag || '行程';
    item.append(timeElement, dot, details, tag);
    return item;
  }

  function saveSchedules() {
    saveStoredList(scheduleStorageKey, getScheduleItems());
  }

  function renderStoredSchedules() {
    const schedules = loadStoredList(scheduleStorageKey);
    if (!Array.isArray(schedules)) return;
    scheduleList.replaceChildren();
    schedules.filter(entry => entry && typeof entry.time === 'string' && typeof entry.title === 'string')
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach(entry => scheduleList.append(renderScheduleItem(entry)));
    scheduleCount.textContent = String(scheduleList.children.length).padStart(2, '0');
  }

  function formatTime(value) {
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  }

  renderStoredSchedules();

  form.addEventListener('submit', event => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const time = timeInput.value;
    if (!title || !time) return;

    const item = renderScheduleItem({ time, title, tag: '新行程', tone: 'dot-green' });
    const existing = [...scheduleList.querySelectorAll('.schedule-item')];
    const next = existing.find(row => row.querySelector('time').dateTime > time);
    if (next) scheduleList.insertBefore(item, next);
    else scheduleList.append(item);
    scheduleCount.textContent = String(scheduleList.querySelectorAll('.schedule-item').length).padStart(2, '0');
    saveSchedules();
    message.textContent = `「${title}」已加入今天的行程。`;
    form.reset();
    timeInput.value = '17:00';
    titleInput.focus();
  });
})();
