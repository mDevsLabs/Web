"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function PropertyGrid({ groups, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsx("div", { ...props, className: cx("md-property-grid", className), children: groups.map((group, index) => /* @__PURE__ */ jsxs("section", { className: "md-glass md-pad-md", "aria-labelledby": `${id}-${index}`, children: [
    /* @__PURE__ */ jsx("h3", { id: `${id}-${index}`, children: group.title }),
    /* @__PURE__ */ jsx("dl", { children: group.properties.map((property, position) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("dt", { children: property.label }),
      /* @__PURE__ */ jsx("dd", { children: property.value })
    ] }, `${property.label}-${position}`)) })
  ] }, group.id)) });
}
export {
  PropertyGrid
};
