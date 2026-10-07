"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { createElement, forwardRef, useId } from "react";
function createIcon(displayName, nodes) {
  const Icon = forwardRef(function Icon2({ size = 24, title, absoluteStrokeWidth = false, children, strokeWidth = 1.5, color, style, ...props }, ref) {
    const generated = useId();
    const titleId = `${generated}-title`;
    const labelled = Boolean(title || props["aria-label"] || props["aria-labelledby"]);
    return /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", color: color ?? "#000", style: { colorScheme: "light dark", color: color ?? "var(--md-icon-color, light-dark(#000, #fff))", ...style }, stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", role: labelled ? "img" : void 0, "aria-hidden": labelled ? void 0 : true, "aria-labelledby": title ? titleId : void 0, focusable: "false", ...props, ref, children: [
      title && /* @__PURE__ */ jsx("title", { id: titleId, children: title }),
      nodes.map(([tag, attrs], index) => createElement(tag, { ...attrs, ...absoluteStrokeWidth ? { vectorEffect: "non-scaling-stroke" } : {}, key: index })),
      children
    ] });
  });
  Icon.displayName = displayName;
  return Icon;
}
export {
  createIcon
};
