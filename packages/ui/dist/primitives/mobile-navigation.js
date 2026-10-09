"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dialog as RDialog } from "radix-ui";
import { useControllable } from "../internal/utils.js";
import { PortalScope } from "../internal/theme.js";
function MobileNavigation({ label, items, currentId, open, onOpenChange }) {
  const [visible, setVisible] = useControllable(open, false, onOpenChange);
  return /* @__PURE__ */ jsxs(RDialog.Root, { open: visible, onOpenChange: setVisible, children: [
    /* @__PURE__ */ jsx(RDialog.Trigger, { asChild: true, children: /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", "aria-label": `Ouvrir : ${label}`, children: "Menu" }) }),
    /* @__PURE__ */ jsx(RDialog.Portal, { children: /* @__PURE__ */ jsxs(PortalScope, { children: [
      /* @__PURE__ */ jsx(RDialog.Overlay, { className: "md-overlay" }),
      /* @__PURE__ */ jsxs(RDialog.Content, { className: "md-dialog md-glass", "aria-describedby": void 0, children: [
        /* @__PURE__ */ jsx(RDialog.Title, { className: "md-heading", children: label }),
        /* @__PURE__ */ jsx("nav", { "aria-label": label, children: /* @__PURE__ */ jsx("ul", { className: "md-navigation-links", children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(RDialog.Close, { asChild: true, children: /* @__PURE__ */ jsx("a", { href: item.href, "aria-current": currentId === item.id ? "page" : void 0, children: item.label }) }) }, item.id)) }) }),
        /* @__PURE__ */ jsx(RDialog.Close, { asChild: true, children: /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", children: "Fermer le menu" }) })
      ] })
    ] }) })
  ] });
}
export {
  MobileNavigation
};
