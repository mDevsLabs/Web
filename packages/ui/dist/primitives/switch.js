"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { Switch as RSwitch } from "radix-ui";
import { cx } from "../internal/utils.js";
function Switch({ label, id, className, ...props }) {
  const generated = useId();
  const inputId = id ?? generated;
  return /* @__PURE__ */ jsxs("div", { className: "md-check-row", children: [
    /* @__PURE__ */ jsx(RSwitch.Root, { ...props, id: inputId, className: cx("md-switch", className), children: /* @__PURE__ */ jsx(RSwitch.Thumb, { className: "md-switch-thumb" }) }),
    /* @__PURE__ */ jsx("label", { htmlFor: inputId, children: label })
  ] });
}
export {
  Switch
};
