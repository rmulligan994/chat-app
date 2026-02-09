"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import { Button1 } from "./Button1";
import * as _utils from "./utils";
import _styles from "./FeatureSectionTest.module.css";

export function FeatureSectionTest({
  as: _Component = _Builtin.Block,
  heading = "Medium length section heading goes here",
  eyebrowText = "Tagline",
  bodyText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
  image = "https://cdn.prod.website-files.com/6697d33c7f0471d6bab6b60c/66c08544ca49535d8bf04caf_6191a88a1c0e39463c2bf022_placeholder-image.svg",
}) {
  return (
    <_Component className={_utils.cx(_styles, "section_layout1")} tag="section">
      <_Builtin.Block
        className={_utils.cx(_styles, "padding-global")}
        tag="div"
      >
        <_Builtin.Block
          className={_utils.cx(_styles, "container-large")}
          tag="div"
        >
          <_Builtin.Block
            className={_utils.cx(_styles, "padding-section-large")}
            tag="div"
          >
            <_Builtin.Block
              className={_utils.cx(_styles, "layout1_component")}
              tag="div"
            >
              <_Builtin.Grid
                className={_utils.cx(_styles, "layout1_content")}
                tag="div"
              >
                <_Builtin.Block
                  className={_utils.cx(_styles, "layout1_content-left")}
                  tag="div"
                >
                  <_Builtin.Block
                    className={_utils.cx(
                      _styles,
                      "margin-bottom",
                      "margin-xsmall"
                    )}
                    tag="div"
                  >
                    <_Builtin.Block
                      className={_utils.cx(_styles, "text-style-tagline")}
                      tag="div"
                    >
                      {eyebrowText}
                    </_Builtin.Block>
                  </_Builtin.Block>
                  <_Builtin.Block
                    className={_utils.cx(
                      _styles,
                      "margin-bottom",
                      "margin-small"
                    )}
                    tag="div"
                  >
                    <_Builtin.Heading
                      className={_utils.cx(_styles, "heading-style-h2-3")}
                      tag="h2"
                    >
                      {heading}
                    </_Builtin.Heading>
                  </_Builtin.Block>
                  <_Builtin.Paragraph
                    className={_utils.cx(_styles, "text-size-medium-3")}
                  >
                    {bodyText}
                  </_Builtin.Paragraph>
                  <_Builtin.Block
                    className={_utils.cx(
                      _styles,
                      "margin-top",
                      "margin-medium"
                    )}
                    tag="div"
                  >
                    <_Builtin.Block
                      className={_utils.cx(_styles, "button-group")}
                      tag="div"
                    >
                      <Button1 />
                    </_Builtin.Block>
                  </_Builtin.Block>
                </_Builtin.Block>
                <_Builtin.Block
                  className={_utils.cx(_styles, "layout1_image-wrapper")}
                  tag="div"
                >
                  <_Builtin.Image
                    className={_utils.cx(_styles, "layout1_image")}
                    width="auto"
                    height="auto"
                    loading="lazy"
                    alt=""
                    src={image}
                  />
                </_Builtin.Block>
              </_Builtin.Grid>
            </_Builtin.Block>
          </_Builtin.Block>
        </_Builtin.Block>
      </_Builtin.Block>
    </_Component>
  );
}
