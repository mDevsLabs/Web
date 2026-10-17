"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
import { Dialog as RDialog } from "radix-ui";
import { PortalScope } from "../internal/theme.js";
function CommandPalette({ items, open, onOpenChange, trigger, title = "Rechercher une action" }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const filtered = items.filter((item) => `${item.label} ${item.keywords ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return /* @__PURE__ */ jsxs(RDialog.Root, { open, onOpenChange: (value) => {
    if (!value)
      setQuery("");
    onOpenChange?.(value);
  }, children: [
    trigger && /* @__PURE__ */ jsx(RDialog.Trigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsx(RDialog.Portal, { children: /* @__PURE__ */ jsxs(PortalScope, { children: [
      /* @__PURE__ */ jsx(RDialog.Overlay, { className: "md-overlay" }),
      /* @__PURE__ */ jsxs(RDialog.Content, { className: "md-glass md-dialog", "aria-describedby": void 0, children: [
        /* @__PURE__ */ jsx(RDialog.Title, { children: title }),
        /* @__PURE__ */ jsx("label", { htmlFor: inputId, className: "md-sr-only", children: "Rechercher une action" }),
        /* @__PURE__ */ jsx("input", { id: inputId, autoFocus: true, className: "md-input", type: "search", value: query, onChange: (e) => setQuery(e.target.value) }),
        /* @__PURE__ */ jsx("ul", { className: "md-command-list", children: filtered.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(RDialog.Close, { asChild: true, children: /* @__PURE__ */ jsx("button", { type: "button", className: "md-list-action", onClick: item.onSelect, children: item.label }) }) }, item.id)) }),
        filtered.length === 0 && /* @__PURE__ */ jsx("p", { role: "status", children: "Aucun r\xE9sultat." }),
        /* @__PURE__ */ jsx(RDialog.Close, { className: "md-close", "aria-label": "Fermer", children: "\xD7" })
      ] })
    ] }) })
  ] });
}
export {
  CommandPalette
};
