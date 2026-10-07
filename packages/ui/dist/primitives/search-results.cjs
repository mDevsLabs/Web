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
var search_results_exports = {};
__export(search_results_exports, {
  SearchResults: () => SearchResults
});
module.exports = __toCommonJS(search_results_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function SearchResults({ label, query, items, pending = false, className, ...props }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { ...props, className: (0, import_utils.cx)("md-search-results", className), "aria-labelledby": id, "aria-busy": pending || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "status", className: "md-muted", children: pending ? "Recherche en cours\u2026" : `${items.length} r\xE9sultat(s)${query ? " pour \xAB " + query + " \xBB" : ""}` }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: item.href, children: item.title }) }),
      item.excerpt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.excerpt })
    ] }) }, item.id)) }),
    !pending && !items.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Aucun r\xE9sultat. Essayez une recherche plus large." })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SearchResults
});
