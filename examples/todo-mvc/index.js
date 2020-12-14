import { part } from "../../core";

let todos = [];
let filter = "all";
let editingId = null;

const Todo = part(({ todo }) => {
  let inputRef = {};
  let $edit = {
    ref: inputRef,
    onkeypress(e) {
      if (e.key !== "Enter") return;
      todo.title = inputRef.current.value;
      editingId = null;
    },
  };
  let $title = { ondblclick: () => (editingId = todo.id) };

  return part`
  <li class="todo" ${() => ({
    ".completed": todo.completed,
    ".editing": todo.id === editingId,
  })}>
    <div class="view">
      <input type="checkbox" class="toggle" ${{ onchange: () => Toggle(todo) }}
        ${() => ({ checked: todo.completed })}/>
      <label ${$title}>${() => todo.title}</label>
      <button class="destroy" ${{ onclick: () => Remove(todo.id) }}></button>
    </div>
    <input type="text" class="edit" ${$edit} ${() => ({ value: todo.title })}/>
  </li>
`;
});

const FilterLink = ({ text, type }) => part`
  <li ${{ onclick: () => (filter = type) }}>
    <a href="#" ${() => ({ ".selected": filter === type })}>${text}</a>
  </li>`;

part(() => {
  let inputRef = {};

  function handleSubmit(e) {
    e.preventDefault();
    todos.push({
      id: Date.now(),
      title: inputRef.current.value,
      completed: false,
    });
    inputRef.current.value = "";
  }

  return () => {
    let activeCount = filterTodos("active", todos).length;
    let visibleTodos = filterTodos(filter, todos);

    return part`
  <div>
    <section class="todoapp">
      <header class="header">
        <h1 class="heading">todos</h1>
        <form ${{ onsubmit: handleSubmit }}>
          <input type="text" class="new-todo" placeholder="What needs to be done ?"
            ${{ ref: inputRef }}/>
        </form>
      </header>
      <section class="main">
        <input id="toggle-all" class="toggle-all" ${{ onclick: ToggleAll }}/>
        <label for="toggle-all"></label>
        <ul class="todo-list">
          ${visibleTodos.map((todo) => Todo({ todo, key: todo.id }))}</ul>
      </section>
      <footer class="footer">
        <span class="todo-count"><strong>${activeCount}</strong> items left</span>
        <ul class="filters">
          ${FilterLink({ text: "All", type: "all" })}
          ${FilterLink({ text: "Active", type: "active" })}
          ${FilterLink({ text: "Completed", type: "completed" })}</ul>
        <button class="clear-completed"
          ${{ onclick: ClearCompleted }}>Clear Completed</button>
      </footer>
    </section>
    <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Written by <a href="https://github.com/linq2js" target="_blank">Linq2Js</a></p>
        <p>Part of <a href="http://todomvc.com" target="_blank">TodoMVC</a></p>
    </footer>
  </div>`;
  };
}).mount({
  container: "#app",
  init: Load,
  effects: [[Save, false]],
});
function Load() {
  todos = JSON.parse(window.localStorage.getItem("appState")) || todos;
}
function Save() {
  window.localStorage.setItem("appState", JSON.stringify(todos));
}
function Remove(id) {
  todos = todos.filter((todo) => todo.id !== id);
}
function Toggle(todo) {
  todo.completed = !todo.completed;
}
function ClearCompleted() {
  todos = filterTodos("active", todos);
}
function ToggleAll() {
  todos.forEach((todo) => {
    todo.completed =
      filter === "all" || (filter === "active" && !todo.completed);
  });
}
function filterTodos(filter, todos) {
  return filter === "active"
    ? todos.filter((todo) => !todo.completed)
    : filter === "completed"
    ? todos.filter((todo) => todo.completed)
    : todos;
}
