"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dialog as RDialog } from "radix-ui";
import { PortalScope } from "../internal/theme.js";
function SessionTimeoutPrompt({ open, onOpenChange, secondsRemaining, onContinue, onSignOut, pending = false, onReturnFocus }) {
  return /* @__PURE__ */ jsx(RDialog.Root, { open, onOpenChange, children: /* @__PURE__ */ jsx(RDialog.Portal, { children: /* @__PURE__ */ jsxs(PortalScope, { children: [
    /* @__PURE__ */ jsx(RDialog.Overlay, { className: "md-overlay" }),
    /* @__PURE__ */ jsxs(RDialog.Content, { className: "md-dialog md-glass", onCloseAutoFocus: (event) => {
      if (onReturnFocus) {
        event.preventDefault();
        onReturnFocus();
      }
    }, children: [
      /* @__PURE__ */ jsx(RDialog.Title, { className: "md-heading", children: "Votre session va expirer" }),
      /* @__PURE__ */ jsxs(RDialog.Description, { children: [
        "Temps restant : ",
        Math.max(0, Math.floor(secondsRemaining)),
        " secondes. Souhaitez-vous poursuivre ?"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md-cluster", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "md-button", disabled: pending, onClick: onContinue, children: "Continuer la session" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", disabled: pending, onClick: onSignOut, children: "Se d\xE9connecter" })
      ] })
    ] })
  ] }) }) });
}
export {
  SessionTimeoutPrompt
};
