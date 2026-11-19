"use client";
const { jsx, jsxs } = require("react/jsx-runtime");
const { Tooltip: RTooltip } = require("radix-ui");
const { PortalScope } = require("../internal/theme.cjs");
function Tooltip({ content, children, delayDuration = 350, side = "top", container }) {
  return /* @__PURE__ */ jsx(RTooltip.Provider, { delayDuration, children: /* @__PURE__ */ jsxs(RTooltip.Root, { children: [
    /* @__PURE__ */ jsx(RTooltip.Trigger, { asChild: true, children }),
    /* @__PURE__ */ jsx(RTooltip.Portal, { container, children: /* @__PURE__ */ jsxs(PortalScope, { children: [
      /* @__PURE__ */ jsxs(RTooltip.Content, { className: "md-tooltip", side, sideOffset: 8, children: [
        content,
        /* @__PURE__ */ jsx(RTooltip.Arrow, { className: "md-tooltip-arrow" })
      ] })
    ] }) })
  ] }) });
}
exports.Tooltip = Tooltip;
