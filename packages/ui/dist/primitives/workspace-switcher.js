"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function WorkspaceSwitcher({ label, workspaces, value, onValueChange, disabled, className, ...props }) {
  const id = useId();
  const current = workspaces.find((workspace) => workspace.id === value);
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-field md-workspace-switcher", className), children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsx("select", { id, className: "md-select", value, disabled, "aria-describedby": current?.description ? `${id}-description` : void 0, onChange: (event) => onValueChange(event.target.value), children: workspaces.map((workspace) => /* @__PURE__ */ jsx("option", { value: workspace.id, disabled: workspace.disabled, children: workspace.name }, workspace.id)) }),
    current?.description && /* @__PURE__ */ jsx("p", { id: `${id}-description`, className: "md-muted", children: current.description })
  ] });
}
export {
  WorkspaceSwitcher
};
