import * as React from "react";
import * as Types from "./types";

declare function CardComponentTest(props: {
  as?: React.ElementType;
  image?: Types.Asset.Image;
  title?: React.ReactNode;
  text?: React.ReactNode;
}): React.JSX.Element;
