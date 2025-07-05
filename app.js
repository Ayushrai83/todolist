const API_URL = 'https://jsonplaceholder.typicode.com/todos';
const LIMIT = 10;

const todoList = document.getElementById('todo-list');
const todoForm = document.getElementById('todo-form');
const taskInput = document.getElementById('task');
const searchInput = document.getElementById('search');
const fromDateInput = document.getElementById('from-date');
const toDateInput = document.getElementById('to-date');
const pagination = document.getElementById('pagination');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

let todos = [];
let currentPage = 1;
let editingTodoId = null;

function generateCreatedDate() {
  const now = new Date();
  return new Date(now.getTime() - Math.floor(Math.random() * 10000000000));
}

async function fetchTodos() {
  showLoading(true);
  try {
    const res = await fetch(`${API_URL}?_limit=100`);
    if (!res.ok) throw new Error('Failed to fetch todos');
    const data = await res.json();
    todos = data.map(todo => ({ ...todo, createdAt: generateCreatedDate() }));
    renderTodos();
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

function renderTodos() {
  const filtered = todos
    .filter(todo => todo.title.toLowerCase().includes(searchInput.value.toLowerCase()))
    .filter(todo => {
      const createdAt = new Date(todo.createdAt);
      const from = fromDateInput.value ? new Date(fromDateInput.value) : null;
      const to = toDateInput.value ? new Date(toDateInput.value) : null;
      return (!from || createdAt >= from) && (!to || createdAt <= to);
    });

  const start = (currentPage - 1) * LIMIT;
  const paginated = filtered.slice(start, start + LIMIT);

  todoList.innerHTML = '';
  if (paginated.length === 0) {
    todoList.innerHTML = '<li class="list-group-item text-center">No tasks found</li>';
  } else {
    paginated.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'list-group-item';

      const row = document.createElement('div');
      row.className = 'row align-items-center';

      const contentCol = document.createElement('div');
      contentCol.className = 'col-12 col-md-8 mb-2 mb-md-0';
      contentCol.innerHTML = `
        <div>${todo.title}</div>
        <small class="text-muted">🗓️ ${new Date(todo.createdAt).toLocaleDateString()}</small>
      `;

      const buttonCol = document.createElement('div');
      buttonCol.className = 'col-12 col-md-4 d-flex flex-column flex-md-row justify-content-md-end gap-2';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-outline-warning w-100 w-md-auto';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => {
        taskInput.value = todo.title;
        editingTodoId = todo.id;
        taskInput.focus();
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-outline-danger w-100 w-md-auto';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => deleteTodo(todo.id);

      buttonCol.appendChild(editBtn);
      buttonCol.appendChild(deleteBtn);

      row.appendChild(contentCol);
      row.appendChild(buttonCol);
      li.appendChild(row);
      todoList.appendChild(li);
    });
  }

  renderPagination(filtered.length);
}



function renderPagination(total) {
  const pages = Math.ceil(total / LIMIT);
  pagination.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (i === currentPage ? ' active' : '');
    const btn = document.createElement('button');
    btn.className = 'page-link';
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderTodos();
    };
    li.appendChild(btn);
    pagination.appendChild(li);
  }
}

todoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newTask = taskInput.value.trim();
  if (!newTask) return;

  showLoading(true);
  try {
    if (editingTodoId !== null) {
      const res = await fetch(`${API_URL}/${editingTodoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask, completed: false })
      });
      if (!res.ok) throw new Error('Failed to update todo');
      const updatedTodo = await res.json();
      const index = todos.findIndex(t => t.id === editingTodoId);
      todos[index].title = updatedTodo.title;
      editingTodoId = null;
    } else {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask, completed: false })
      });
      if (!res.ok) throw new Error('Failed to add todo');
      const data = await res.json();
      data.createdAt = new Date();
      todos.unshift(data);
      currentPage = 1;
    }
    taskInput.value = '';
    renderTodos();
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
});

async function deleteTodo(id) {
  const confirmDelete = confirm('Are you sure you want to delete this task?');
  if (!confirmDelete) return;

  showLoading(true);
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete todo');
    todos = todos.filter(t => t.id !== id);
    renderTodos();
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

searchInput.addEventListener('input', () => {
  currentPage = 1;
  renderTodos();
});

fromDateInput.addEventListener('change', () => {
  currentPage = 1;
  renderTodos();
});

toDateInput.addEventListener('change', () => {
  currentPage = 1;
  renderTodos();
});

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
  setTimeout(() => errorDiv.classList.add('d-none'), 3000);
}

function showLoading(state) {
  loading.classList.toggle('d-none', !state);
}

fetchTodos();
