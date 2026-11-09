"use client";
const { jsx, jsxs } = require("react/jsx-runtime");
const { useId } = require("react");
const { Dialog: RDialog } = require("radix-ui");
const { PortalScope } = require("../internal/theme.cjs");
function Drawer({ title, description, trigger, children, side = "right", closeLabel = "Fermer", container, ...props }) {
  const descriptionId = useId();
  return /* @__PURE__ */ jsxs(RDialog.Root, { ...props, children: [
    trigger && /* @__PURE__ */ jsx(RDialog.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RDialog.Portal, { container, children: /* @__PURE__ */ jsxs(PortalScope, { children: [
      /* @__PURE__ */ jsx(RDialog.Overlay, { className: "md-overlay" }),
      /* @__PURE__ */ jsxs(RDialog.Content, { className: "md-glass md-drawer", "data-side": side, "aria-describedby": description ? descriptionId : void 0, children: [
        /* @__PURE__ */ jsx(RDialog.Title, { children: title }),
        description && /* @__PURE__ */ jsx(RDialog.Description, { id: descriptionId, className: "md-muted", children: description }),
        children,
        /* @__PURE__ */ jsx(RDialog.Close, { className: "md-close", "aria-label": closeLabel, children: "\xD7" })
      ] })
    ] }) })
  ] });
}
exports.Drawer = Drawer;
