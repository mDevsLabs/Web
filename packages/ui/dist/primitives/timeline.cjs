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
var timeline_exports = {};
__export(timeline_exports, {
  Timeline: () => Timeline
});
module.exports = __toCommonJS(timeline_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Timeline({ events, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { ...props, className: (0, import_utils.cx)("md-timeline", className), children: events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-timeline-dot", "aria-hidden": "true" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: event.title }),
      event.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: event.description }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { className: "md-muted", dateTime: event.date, children: event.date })
    ] })
  ] }, event.id)) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Timeline
});
