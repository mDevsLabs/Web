"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Tooltip as RTooltip } from "radix-ui";
import { PortalScope } from "../internal/theme.js";
function Tooltip({ content, children, delayDuration = 350, side = "top" }) {
  return /* @__PURE__ */ jsx(RTooltip.Provider, { delayDuration, children: /* @__PURE__ */ jsxs(RTooltip.Root, { children: [
    /* @__PURE__ */ jsx(RTooltip.Trigger, { asChild: true, children }),
    /* @__PURE__ */ jsx(RTooltip.Portal, { children: /* @__PURE__ */ jsx(PortalScope, { children: /* @__PURE__ */ jsxs(RTooltip.Content, { className: "md-tooltip", side, sideOffset: 8, children: [
      content,
      /* @__PURE__ */ jsx(RTooltip.Arrow, {})
    ] }) }) })
  ] }) });
}
export {
  Tooltip
};
