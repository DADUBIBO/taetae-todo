import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { firebaseConfig } from "./env.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const todosRef = ref(db, "todos");

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editInput = document.getElementById("edit-input");

let todos = [];
let editId = null;

function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";

    const content = document.createElement("div");
    content.className = "todo-content";

    const text = document.createElement("span");
    text.className = `todo-text${todo.done ? " done" : ""}`;
    text.textContent = todo.text;
    text.addEventListener("click", () => toggleDone(todo.id));

    const buttons = document.createElement("div");
    buttons.className = "button-group";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "todo-button";
    editButton.textContent = "수정";
    editButton.addEventListener("click", () => openEditModal(todo.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "todo-button delete";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", () => removeTodo(todo.id));

    buttons.append(editButton, deleteButton);
    content.append(text);
    item.append(content, buttons);
    todoList.appendChild(item);
  });
}

async function addTodo(text) {
  const newTodoRef = push(todosRef);
  await set(newTodoRef, {
    text: text.trim(),
    done: false,
    createdAt: serverTimestamp(),
  });
}

function openEditModal(id) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return;

  editId = id;
  editInput.value = todo.text;
  editModal.classList.remove("hidden");
  editInput.focus();
  editInput.select();
}

function closeEditModal() {
  editModal.classList.add("hidden");
  editId = null;
  editInput.value = "";
}

async function updateTodo(id, newText) {
  const todoRef = ref(db, `todos/${id}`);
  await update(todoRef, {
    text: newText.trim(),
  });
}

async function removeTodo(id) {
  const todoRef = ref(db, `todos/${id}`);
  await remove(todoRef);
  if (editId === id) {
    closeEditModal();
  }
}

async function toggleDone(id) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return;

  const todoRef = ref(db, `todos/${id}`);
  await update(todoRef, {
    done: !todo.done,
  });
}

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const newText = todoInput.value;

  if (!newText.trim()) {
    todoInput.value = "";
    todoInput.focus();
    return;
  }

  if (editId !== null) {
    await updateTodo(editId, newText);
    closeEditModal();
  } else {
    await addTodo(newText);
  }

  todoInput.value = "";
  todoInput.focus();
});

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (editId === null) return;

  const updatedText = editInput.value;
  if (!updatedText.trim()) {
    editInput.focus();
    return;
  }

  await updateTodo(editId, updatedText);
  closeEditModal();
});

editModal.addEventListener("click", (event) => {
  if (event.target.dataset.action === "close-edit") {
    closeEditModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !editModal.classList.contains("hidden")) {
    closeEditModal();
  }
});

onValue(todosRef, (snapshot) => {
  const data = snapshot.val() || {};
  todos = Object.keys(data)
    .map((key) => ({ id: key, ...data[key] }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  renderTodos();
});

