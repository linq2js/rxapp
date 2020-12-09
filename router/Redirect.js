import { effect } from "../core/index";
import createComponent from "../core/createComponent";
import { emptyArray } from "../core/util";
import history from "./history";

let Redirect = createComponent((props) => {
  effect(
    () => history.redirect(props),
    () => emptyArray
  );
});

export default Redirect;
