"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./Button1.module.css";

export function Button1({
  as: _Component = _Builtin.Link,
  buttonText = "Button",

  link = {
    href: "#",
  },
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "button-4", "is-secondary")}
      button={true}
      block=""
      options={link}
    >
      {buttonText}
    </_Component>
  );
}
