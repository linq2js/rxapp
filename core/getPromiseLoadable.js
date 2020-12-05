export default function getPromiseLoadable(promise) {
  let loadable = promise.$$loadable;
  if (!loadable) {
    promise.$$loadable = loadable = { status: "loading" };
    promise.then(
      (result) => {
        loadable.value = result;
        loadable.status = "loaded";
      },
      (error) => {
        loadable.error = error;
        loadable.status = "failed";
      }
    );
  }
  return loadable;
}
