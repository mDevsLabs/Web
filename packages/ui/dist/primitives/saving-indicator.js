"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function SavingIndicator({ state, labels, className, ...props }) {
  const text = { idle: "Aucune modification", saving: "Enregistrement en cours\u2026", saved: "Enregistr\xE9", error: "\xC9chec de l\u2019enregistrement" };
  return /* @__PURE__ */ jsxs("span", { ...props, role: "status", className: cx("md-saving-indicator", className), "data-state": state, children: [
    state === "saving" && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "md-spinner" }),
    labels?.[state] ?? text[state]
  ] });
}
export {
  SavingIndicator
};
