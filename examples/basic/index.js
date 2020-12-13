import { part } from "rxapp";

let todos = [];
let text = "";
function add() {
  todos = todos.concat({ text });
  text = "";
}
part`<form ${{ onsubmit: add, action: "javascript:void 0" }}>
      <label>
        <input ${() => ({
          value: text,
          placeholder: "Enter todo text",
          oninput: (e) => (text = e.target.value),
        })} />
      </label>
      <ul>${() => todos.map((todo) => part`<li>${todo.text}</li>`)}</ul>
    </form>`.mount({
  effects: [
    () => {
      console.log(11);
    },
  ],
});
