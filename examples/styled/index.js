import { part } from "../../core";
import { styled } from "../../styled";

styled`
  height: 100%;
  margin: 0;
  
  body {
    height: 100%;
    margin: 0;
    padding: 200px;
  }
  `;

let redHeading = styled("h1")`
  color: ${(props) => props.color};
  font-size: ${(props) => props.size};
`;

part`${Array(1000)
  .fill()
  .map((_, index) =>
    redHeading({
      text: "Heading " + index,
      size: "1em",
      color: "#" + Math.floor(Math.random() * 0xffffff).toString(16),
    })
  )}`.mount("#app");
