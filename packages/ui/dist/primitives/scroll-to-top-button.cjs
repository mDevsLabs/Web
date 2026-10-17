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
var scroll_to_top_button_exports = {};
__export(scroll_to_top_button_exports, {
  ScrollToTopButton: () => ScrollToTopButton
});
module.exports = __toCommonJS(scroll_to_top_button_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function ScrollToTopButton({ threshold = 300, children = "Retour en haut", className, onClick, ...props }) {
  const [visible, setVisible] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    const update = () => setVisible(window.scrollY >= threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ...props, type: "button", hidden: !visible, className: (0, import_utils.cx)("md-button md-button-outline md-scroll-top", className), onClick: (event) => {
    onClick?.(event);
    if (!event.defaultPrevented)
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, children });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScrollToTopButton
});
