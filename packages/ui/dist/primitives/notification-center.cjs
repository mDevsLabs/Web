"use client";
"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var notification_center_exports = {};
__export(notification_center_exports, {
  NotificationCenter: () => NotificationCenter
});
module.exports = __toCommonJS(notification_center_exports);
var import_jsx_runtime = require("react/jsx-runtime");
function NotificationCenter({ notifications, onMarkRead, label = "Notifications" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "md-glass md-card", "aria-label": label, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: label }),
    notifications.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "md-item-list", children: notifications.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: n.title }),
      n.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: n.description }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { className: "md-muted", dateTime: n.date, children: n.date }),
      !n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-badge", children: "Non lue" }),
        onMarkRead && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", onClick: () => onMarkRead(n.id), children: "Marquer comme lue" })
      ] })
    ] }, n.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "md-muted", children: "Aucune notification." })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NotificationCenter
});
