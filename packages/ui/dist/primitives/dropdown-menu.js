"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { DropdownMenu as RDropdown } from "radix-ui";
import { PortalScope } from "../internal/theme.js";
function DropdownMenu({ trigger, items, label }) {
  return /* @__PURE__ */ jsxs(RDropdown.Root, { children: [
    /* @__PURE__ */ jsx(RDropdown.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RDropdown.Portal, { children: /* @__PURE__ */ jsx(PortalScope, { children: /* @__PURE__ */ jsx(RDropdown.Content, { className: "md-glass md-menu", sideOffset: 8, "aria-label": label, children: items.map((item) => /* @__PURE__ */ jsxs("span", { children: [
      item.separatorBefore && /* @__PURE__ */ jsx(RDropdown.Separator, { className: "md-separator" }),
      /* @__PURE__ */ jsx(RDropdown.Item, { className: "md-menu-item", disabled: item.disabled, "data-danger": item.danger || void 0, onSelect: item.onSelect, children: item.label })
    ] }, item.id)) }) }) })
  ] });
}
export {
  DropdownMenu
};
