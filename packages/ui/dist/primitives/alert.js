"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Alert({ tone = "info", heading, live = false, className, children, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, role: live ? tone === "danger" ? "alert" : "status" : void 0, className: cx("md-alert", className), "data-tone": tone, children: [
    heading && /* @__PURE__ */ jsx("strong", { children: heading }),
    /* @__PURE__ */ jsx("div", { children })
  ] });
}
export {
  Alert
};
