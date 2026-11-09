"use client";
const { jsx, jsxs } = require("react/jsx-runtime");
const { DropdownMenu: RDropdown } = require("radix-ui");
const { PortalScope } = require("../internal/theme.cjs");
function DropdownMenu({ trigger, items, label, container }) {
  return /* @__PURE__ */ jsxs(RDropdown.Root, { children: [
    /* @__PURE__ */ jsx(RDropdown.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RDropdown.Portal, { container, children: /* @__PURE__ */ jsx(PortalScope, { children: /* @__PURE__ */ jsx(RDropdown.Content, { className: "md-glass md-menu", sideOffset: 8, "aria-label": label, children: items.map((item) => /* @__PURE__ */ jsxs("span", { children: [
      item.separatorBefore && /* @__PURE__ */ jsx(RDropdown.Separator, { className: "md-separator" }),
      /* @__PURE__ */ jsx(RDropdown.Item, { className: "md-menu-item", disabled: item.disabled, "data-danger": item.danger || void 0, onSelect: item.onSelect, children: item.label })
    ] }, item.id)) }) }) })
  ] });
}
exports.DropdownMenu = DropdownMenu;
