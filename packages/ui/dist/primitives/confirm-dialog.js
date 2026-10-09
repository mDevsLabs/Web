"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dialog as RDialog } from "radix-ui";
import { PortalScope } from "../internal/theme.js";
function ConfirmDialog({ title, description, trigger, onConfirm, confirmLabel = "Confirmer", cancelLabel = "Annuler" }) {
  return /* @__PURE__ */ jsxs(RDialog.Root, { children: [
    /* @__PURE__ */ jsx(RDialog.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RDialog.Portal, { children: /* @__PURE__ */ jsxs(PortalScope, { children: [
      /* @__PURE__ */ jsx(RDialog.Overlay, { className: "md-overlay" }),
      /* @__PURE__ */ jsxs(RDialog.Content, { className: "md-glass md-dialog", children: [
        /* @__PURE__ */ jsx(RDialog.Title, { children: title }),
        /* @__PURE__ */ jsx(RDialog.Description, { children: description }),
        /* @__PURE__ */ jsxs("div", { className: "md-cluster", children: [
          /* @__PURE__ */ jsx(RDialog.Close, { className: "md-button md-button-outline", children: cancelLabel }),
          /* @__PURE__ */ jsx(RDialog.Close, { className: "md-button", onClick: onConfirm, children: confirmLabel })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  ConfirmDialog
};
