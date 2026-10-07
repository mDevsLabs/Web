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
var issue_filters_exports = {};
__export(issue_filters_exports, {
  IssueFilters: () => IssueFilters
});
module.exports = __toCommonJS(issue_filters_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_domain = require("../../internal/domain.cjs");
var import_config = require("./config.cjs");
function IssueFilters({ onStatusChange, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_domain.DomainFilters, { config: import_config.config, ...props, onStatusChange: onStatusChange ? (value) => onStatusChange(value) : void 0 });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IssueFilters
});
