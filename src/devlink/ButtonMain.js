"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _interactions from "./interactions";
import * as _utils from "./utils";
import _styles from "./ButtonMain.module.css";

const _interactionsData = JSON.parse(
  '{"events":{"e-66":{"id":"e-66","name":"","animationType":"custom","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-22","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-67"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"59ed8d91-03a3-c442-d3ae-207d54d1f9a3","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"59ed8d91-03a3-c442-d3ae-207d54d1f9a3","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1693169403167},"e-67":{"id":"e-67","name":"","animationType":"custom","eventTypeId":"MOUSE_OUT","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-23","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-66"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"59ed8d91-03a3-c442-d3ae-207d54d1f9a3","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"59ed8d91-03a3-c442-d3ae-207d54d1f9a3","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1693169403168},"e-68":{"id":"e-68","name":"","animationType":"preset","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-22","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-69"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"45c295eb-044a-5502-ee60-63dd1b5a9cc6","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"45c295eb-044a-5502-ee60-63dd1b5a9cc6","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1725643496191},"e-69":{"id":"e-69","name":"","animationType":"preset","eventTypeId":"MOUSE_OUT","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-23","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-68"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"45c295eb-044a-5502-ee60-63dd1b5a9cc6","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"45c295eb-044a-5502-ee60-63dd1b5a9cc6","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1725643496191}},"actionLists":{"a-22":{"id":"a-22","title":"👆 Button Hover In-02","actionItemGroups":[{"actionItems":[{"id":"a-22-n","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".button-text-main","selectorGuids":["2c966e76-d17c-a7d4-5752-5f45ac538b9a"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}},{"id":"a-22-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".button-text-main.is-absolute","selectorGuids":["2c966e76-d17c-a7d4-5752-5f45ac538b9a","2c966e76-d17c-a7d4-5752-5f45ac538b9b"]},"yValue":150,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]},{"actionItems":[{"id":"a-22-n-3","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuart","duration":300,"target":{"useEventTarget":"CHILDREN","selector":".button-text-main","selectorGuids":["2c966e76-d17c-a7d4-5752-5f45ac538b9a"]},"yValue":-150,"xUnit":"PX","yUnit":"%","zUnit":"PX"}},{"id":"a-22-n-4","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuart","duration":300,"target":{"useEventTarget":"CHILDREN","selector":".button-text-main.is-absolute","selectorGuids":["2c966e76-d17c-a7d4-5752-5f45ac538b9a","2c966e76-d17c-a7d4-5752-5f45ac538b9b"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]}],"useFirstGroupAsInitialState":true,"createdOn":1651331945885},"a-23":{"id":"a-23","title":"👇Button Hover Out-02","actionItemGroups":[{"actionItems":[{"id":"a-23-n","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".button-text-main","selectorGuids":["2c966e76-d17c-a7d4-5752-5f45ac538b9a"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}},{"id":"a-23-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".button-text-main.is-absolute","selectorGuids":["2c966e76-d17c-a7d4-5752-5f45ac538b9a","2c966e76-d17c-a7d4-5752-5f45ac538b9b"]},"yValue":150,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]}],"useFirstGroupAsInitialState":false,"createdOn":1651331945885}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function ButtonMain({
  as: _Component = _Builtin.Link,
  text = "This is the default text value",
}) {
  _interactions.useInteractions(_interactionsData, _styles);

  return (
    <_Component
      className={_utils.cx(_styles, "button-main")}
      data-w-id="59ed8d91-03a3-c442-d3ae-207d54d1f9a3"
      button={false}
      block="inline"
      options={{
        href: "#",
      }}
    >
      <_Builtin.Block
        className={_utils.cx(_styles, "button-text-main")}
        tag="div"
      >
        {"Start a Project"}
      </_Builtin.Block>
      <_Builtin.Block
        className={_utils.cx(_styles, "button-text-main", "is-absolute")}
        tag="div"
      >
        {"Start a Project"}
      </_Builtin.Block>
    </_Component>
  );
}
