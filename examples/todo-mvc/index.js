import { part } from "../../core";

let todos = [],
  filter = "all",
  editingId = null;

// components
part(() => {
  let inputRef = {};
  let inputBinding = { ref: inputRef };
  let clearCompleteBinding = { onclick: ClearCompleted };
  let allFilter = FilterLink({ text: "All", type: "all", filter });
  let activeFilter = FilterLink({ text: "Active", type: "active", filter });
  let completedFilter = FilterLink({
    text: "Completed",
    type: "completed",
    filter,
  });

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
          <input type="text" class="new-todo" placeholder="What needs to be done ?" ${inputBinding}/>
        </form>
      </header>
      <section class="main">
        <input id="toggle-all" class="toggle-all" ${{ onclick: ToggleAll }}/>
        <label for="toggle-all"></label>
        <ul class="todo-list">${visibleTodos.map((todo) =>
          Todo({ todo, key: todo.id, editing: editingId === todo.id })
        )}</ul>
      </section>
      <footer class="footer">
        <span class="todo-count">
          <strong>${activeCount}</strong> items left
        </span>
        <ul class="filters">${allFilter} ${activeFilter} ${completedFilter}</ul>
        <button class="clear-completed" ${clearCompleteBinding}>Clear Completed</button>
      </footer>
    </section>
    <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Written by <a href="https://github.com/linq2js" target="_blank">Linq2Js</a></p>
        <p>Part of <a href="http://todomvc.com" target="_blank">TodoMVC</a></p>
    </footer>
  </div>
  `;
  };
}).mount("#app");

const Todo = part((props) => {
  let inputRef = {};
  let todo = props.todo;
  let liBinding = () => ({
    class: { completed: todo.completed, editing: props.editing },
  });
  function handleEdit(e) {
    if (e.key !== "Enter") return;
    todo.title = inputRef.current.value;
    editingId = null;
  }
  function handleToggle() {
    todo.completed = !todo.completed;
  }

  return part`
  <li class="todo" ${liBinding}>
    <div class="view">
      <input type="checkbox" class="toggle" ${{
        onchange: handleToggle,
      }} ${() => ({ checked: todo.completed })}/>
      <label ${{ ondblclick: () => (editingId = todo.id) }}>
        ${() => todo.title}</label>
      <button class="destroy" ${{ onclick: () => Remove(todo.id) }}></button>
    </div>
    <input type="text" class="edit" ${{
      ref: inputRef,
      onkeypress: handleEdit,
    }} ${() => ({ value: todo.title })}/>
  </li>
`;
});

const FilterLink = ({ text, type, filter }) => part`
  <li ${{ onclick: () => (filter = type) }}>
    <a href="#" ${{ class: { selected: filter === type } }}>${text}</a>
  </li>`;

// actions
const Load = (state) =>
  JSON.parse(window.localStorage.getItem("appState")) || state;

const Save = (state) => {
  window.localStorage.setItem("appState", JSON.stringify(state));
};

const ToggleAll = () =>
  todos.forEach((todo) => {
    todo.completed =
      filter === "all" || (filter === "active" && !todo.completed);
  });

const Remove = (id) => (todos = todos.filter((todo) => todo.id !== id));

const ClearCompleted = () => (todos = filterTodos("active", todos));

// utils
const filterTodos = (filter, todos) =>
  filter === "active"
    ? todos.filter((todo) => !todo.completed)
    : filter === "completed"
    ? todos.filter((todo) => todo.completed)
    : todos;
