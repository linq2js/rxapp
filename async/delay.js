/**
 * create a promise that will be resolved with given value after given ms milliseconds
 * @param ms
 * @param value
 * @return {Promise<unknown>}
 */
export default function delay(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}
