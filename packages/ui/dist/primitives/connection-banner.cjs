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
var connection_banner_exports = {};
__export(connection_banner_exports, {
  ConnectionBanner: () => ConnectionBanner
});
module.exports = __toCommonJS(connection_banner_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function ConnectionBanner({ state, onReconnect, className, ...props }) {
  const labels = { online: "Connexion r\xE9tablie.", offline: "Vous \xEAtes hors ligne.", reconnecting: "Reconnexion en cours\u2026" };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, role: "status", className: (0, import_utils.cx)("md-connection-banner", className), "data-state": state, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: labels[state] }),
    onReconnect && state === "offline" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-outline", onClick: onReconnect, children: "Reconnecter" })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConnectionBanner
});
