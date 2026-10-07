"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { Dialog as RDialog } from "radix-ui";
import { PortalScope } from "../internal/theme.js";
function Drawer({ title, description, trigger, children, side = "right", closeLabel = "Fermer", ...props }) {
  const descriptionId = useId();
  return /* @__PURE__ */ jsxs(RDialog.Root, { ...props, children: [
    trigger && /* @__PURE__ */ jsx(RDialog.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RDialog.Portal, { children: /* @__PURE__ */ jsxs(PortalScope, { children: [
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
export {
  Drawer
};
