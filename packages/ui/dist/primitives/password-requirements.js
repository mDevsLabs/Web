"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function PasswordRequirements({ value, minLength = 12, label = "Conditions du mot de passe", className, ...props }) {
  const id = useId();
  const rules = [{ label: `Au moins ${minLength} caract\xE8res`, met: value.length >= minLength }, { label: "Une lettre majuscule", met: /[A-Z]/.test(value) }, { label: "Une lettre minuscule", met: /[a-z]/.test(value) }, { label: "Un chiffre", met: /[0-9]/.test(value) }];
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-password-rules", className), "aria-labelledby": id, children: [
    /* @__PURE__ */ jsx("p", { id, children: label }),
    /* @__PURE__ */ jsx("ul", { children: rules.map((rule) => /* @__PURE__ */ jsxs("li", { "data-met": rule.met || void 0, children: [
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: rule.met ? "\u2713" : "\u25CB" }),
      /* @__PURE__ */ jsx("span", { className: "md-sr-only", children: rule.met ? "Respect\xE9 : " : "\xC0 compl\xE9ter : " }),
      rule.label
    ] }, rule.label)) })
  ] });
}
export {
  PasswordRequirements
};
