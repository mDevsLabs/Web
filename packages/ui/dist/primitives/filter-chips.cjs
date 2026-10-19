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
var filter_chips_exports = {};
__export(filter_chips_exports, {
  FilterChips: () => FilterChips
});
module.exports = __toCommonJS(filter_chips_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function FilterChips({ label, filters, onRemove, onClear, className, ...props }) {
  const region = (0, import_react.useRef)(null);
  const shouldFocus = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
    if (shouldFocus.current) {
      shouldFocus.current = false;
      const target = region.current?.querySelector("button");
      if (target)
        target.focus();
      else
        region.current?.focus();
    }
  }, [filters.length]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, ref: region, tabIndex: -1, role: "group", "aria-label": label, className: (0, import_utils.cx)("md-filter-chips", className), children: [
    filters.map((filter) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "md-filter-chip", children: [
      filter.label,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-label": `Retirer le filtre ${filter.label}`, onClick: () => {
        shouldFocus.current = true;
        onRemove(filter.id);
      }, children: "\xD7" })
    ] }, filter.id)),
    onClear && filters.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "md-button md-button-ghost", onClick: () => {
      shouldFocus.current = true;
      onClear();
    }, children: "Tout effacer" }),
    !filters.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-muted", children: "Aucun filtre actif." })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FilterChips
});
