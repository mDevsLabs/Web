"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Popover as RPopover } from "radix-ui";
import { PortalScope } from "../internal/theme.js";
function Popover({ trigger, children, label, side = "bottom", ...props }) {
  return /* @__PURE__ */ jsxs(RPopover.Root, { ...props, children: [
    /* @__PURE__ */ jsx(RPopover.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RPopover.Portal, { children: /* @__PURE__ */ jsx(PortalScope, { children: /* @__PURE__ */ jsxs(RPopover.Content, { side, sideOffset: 8, className: "md-glass md-popover", "aria-label": label, children: [
      children,
      /* @__PURE__ */ jsx(RPopover.Arrow, { className: "md-popover-arrow" })
    ] }) }) })
  ] });
}
export {
  Popover
};
