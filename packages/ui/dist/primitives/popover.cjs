"use client";
const { jsx, jsxs } = require("react/jsx-runtime");
const { Popover: RPopover } = require("radix-ui");
const { PortalScope } = require("../internal/theme.cjs");
function Popover({ trigger, children, label, side = "bottom", container, ...props }) {
  return /* @__PURE__ */ jsxs(RPopover.Root, { ...props, children: [
    /* @__PURE__ */ jsx(RPopover.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RPopover.Portal, { container, children: /* @__PURE__ */ jsxs(PortalScope, { children: [
      /* @__PURE__ */ jsxs(RPopover.Content, { side, sideOffset: 8, className: "md-glass md-popover", "aria-label": label, children: [
        children,
        /* @__PURE__ */ jsx(RPopover.Arrow, { className: "md-popover-arrow" })
      ] })
    ] }) })
  ] });
}
exports.Popover = Popover;
