"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./YellowButton.module.css";

export function YellowButton({
  as: _Component = _Builtin.Link,

  link = {
    href: "#",
  },

  text = "Button",
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "button", "is-icon", "is-tertiary")}
      button={false}
      block="inline"
      options={link}
    >
      <_Builtin.Block tag="div">{text}</_Builtin.Block>
      <_Builtin.HtmlEmbed
        className={_utils.cx(_styles, "icon-embed-xxsmall-6")}
        value="%3Csvg%20width%3D%2216%22%20height%3D%2216%22%20viewbox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M6%203L11%208L6%2013%22%20stroke%3D%22CurrentColor%22%20stroke-width%3D%221.5%22%2F%3E%0A%3C%2Fsvg%3E"
      />
    </_Component>
  );
}
