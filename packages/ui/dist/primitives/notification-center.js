"use client";
"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function NotificationCenter({ notifications, onMarkRead, label = "Notifications" }) {
  return /* @__PURE__ */ jsxs("section", { className: "md-glass md-card", "aria-label": label, children: [
    /* @__PURE__ */ jsx("h3", { children: label }),
    notifications.length ? /* @__PURE__ */ jsx("ul", { className: "md-item-list", children: notifications.map((n) => /* @__PURE__ */ jsxs("li", { children: [
      /* @__PURE__ */ jsx("strong", { children: n.title }),
      n.description && /* @__PURE__ */ jsx("p", { children: n.description }),
      /* @__PURE__ */ jsx("time", { className: "md-muted", dateTime: n.date, children: n.date }),
      !n.read && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { className: "md-badge", children: "Non lue" }),
        onMarkRead && /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", onClick: () => onMarkRead(n.id), children: "Marquer comme lue" })
      ] })
    ] }, n.id)) }) : /* @__PURE__ */ jsx("p", { className: "md-muted", children: "Aucune notification." })
  ] });
}
export {
  NotificationCenter
};
