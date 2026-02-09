"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import { YellowButton } from "./YellowButton";
import * as _utils from "./utils";
import _styles from "./CardComponentTest.module.css";

export function CardComponentTest({
  as: _Component = _Builtin.Block,
  image = "https://cdn.prod.website-files.com/6697d33c7f0471d6bab6b60c/68dff222380f9a0236a44ebb_icon.svg",
  title = "Medium length section heading goes here",
  text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ",
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "card-row39_card")}
      id={_utils.cx(
        _styles,
        "w-node-_67ba4252-cac2-25a2-93ea-3a50cc5c1d58-cc5c1d58"
      )}
      tag="div"
    >
      <_Builtin.Block
        className={_utils.cx(_styles, "card-row39_card-content")}
        tag="div"
      >
        <_Builtin.Block
          className={_utils.cx(_styles, "card-row39_card-content-top")}
          tag="div"
        >
          <_Builtin.Block
            className={_utils.cx(_styles, "margin-bottom", "margin-small")}
            tag="div"
          >
            <_Builtin.Image
              className={_utils.cx(_styles, "icon-1x1-medium")}
              loading="lazy"
              width="auto"
              height="auto"
              alt=""
              src={image}
            />
          </_Builtin.Block>
          <_Builtin.Block
            className={_utils.cx(_styles, "margin-bottom", "margin-xsmall")}
            tag="div"
          >
            <_Builtin.Heading
              className={_utils.cx(_styles, "heading-style-h4")}
              tag="h3"
            >
              {title}
            </_Builtin.Heading>
          </_Builtin.Block>
          <_Builtin.Paragraph>{text}</_Builtin.Paragraph>
        </_Builtin.Block>
        <_Builtin.Block
          className={_utils.cx(_styles, "margin-top", "margin-small")}
          tag="div"
        >
          <_Builtin.Block
            className={_utils.cx(_styles, "button-group")}
            tag="div"
          >
            <YellowButton />
          </_Builtin.Block>
        </_Builtin.Block>
      </_Builtin.Block>
    </_Component>
  );
}
