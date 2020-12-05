let microTask = Promise.resolve().then.bind(Promise.resolve());

let queue = new Set();

export function enqueue(handlers) {
  for (let i = 0; i < handlers.length; i++) queue.add(handlers[i]);
  let length = queue.size;
  microTask(() => {
    if (length !== queue.size) return;
    let old = queue;
    queue = new Set();
    old.forEach((handler) => handler());
  });
}
