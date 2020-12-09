import { delay, lazy } from "../../async";
import { part } from "../../core";
import {
  Router,
  useRouterContext,
  link,
  redirect,
  location,
  Redirect,
} from "../../router";

let user;
let count = 0;
let loggedOn;
const LazyComponent = lazy(
  () => import("./lazyComponent").then((x) => delay(500, x.default)),
  "Loading..."
);
const HomePage = part`Home Page`;
const ProductPage = part(() => {
  const router = useRouterContext();
  return part`Product Details: ${() => router.current.match.params.productId}`;
});
const NotFoundPage = part`404 Page`;
const ProfilePage = part`You are logged in as : <strong>${() => user}</strong>`;
const LoginPage = part(() => () => {
  if (user) return Redirect({ to: location.state.from || "/" });
  return part`You must log in to view the page at ${location.state.from}`;
});
const Protected = part((props) => () => {
  if (user) return props.route;
  return Redirect({ to: "/login", state: { from: location.pathname } });
});
const Increase = () => count++;

const routes = {
  "/": HomePage,
  "/product/:productId": ProductPage,
  "/login": LoginPage,
  "/lazy": LazyComponent,
  "/profile": Protected({ route: ProfilePage }),
  _: NotFoundPage,
};

const Login = () => {
  user = "admin";
  loggedOn = Date.now();
};
const Logout = () => {
  user = null;
};

const App = part`
  <h1>Router Demo</h1>
  <h2>${() => count}</h2>
  <button ${{ onclick: Increase }}>Increase</button>
  <p>
    <a ${{ href: "/product/" + Date.now() }} ${link}>Product</a> |
    <a href="/profile" ${link()}>Profile</a>
    <a href="/lazy" ${link({ state: "World" })}>Lazy component</a>
  </p>
  <p>
    <button ${() => ({
      onclick: Login,
      style: user && "display: none",
    })}>Login</button>
    <button ${() => ({
      onclick: Logout,
      style: !user && "display: none",
    })}>Logout</button>
  </p>
  ${Router({ routes })}`;

App.mount("#app");
