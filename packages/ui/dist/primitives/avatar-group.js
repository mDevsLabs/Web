"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function AvatarGroup({ names, max = 4, className, ...props }) {
  const count = Math.max(1, max);
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-avatar-group", className), role: "group", "aria-label": names.join(", "), children: [
    names.slice(0, count).map((name, i) => /* @__PURE__ */ jsx("span", { className: "md-avatar", title: name, "aria-hidden": "true", children: name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase() }, `${name}-${i}`)),
    names.length > count && /* @__PURE__ */ jsxs("span", { className: "md-avatar", children: [
      "+",
      names.length - count
    ] })
  ] });
}
export {
  AvatarGroup
};
