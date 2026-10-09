"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { forwardRef, useState } from "react";
import { cx } from "../internal/utils.js";
const PasswordInput = forwardRef(function PasswordInput2({ showLabel = "Afficher le mot de passe", hideLabel = "Masquer le mot de passe", className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "md-password", children: [
    /* @__PURE__ */ jsx("input", { ...props, ref, type: visible ? "text" : "password", className: cx("md-input", className) }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", "aria-label": visible ? hideLabel : showLabel, "aria-pressed": visible, onClick: () => setVisible(!visible), children: visible ? "Masquer" : "Afficher" })
  ] });
});
export {
  PasswordInput
};
