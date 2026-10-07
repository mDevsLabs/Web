"use client";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var employee_exports = {};
module.exports = __toCommonJS(employee_exports);
__reExport(employee_exports, require("./types.cjs"), module.exports);
__reExport(employee_exports, require("./employee-overview.cjs"), module.exports);
__reExport(employee_exports, require("./employee-card.cjs"), module.exports);
__reExport(employee_exports, require("./employee-list.cjs"), module.exports);
__reExport(employee_exports, require("./employee-table.cjs"), module.exports);
__reExport(employee_exports, require("./employee-form.cjs"), module.exports);
__reExport(employee_exports, require("./employee-filters.cjs"), module.exports);
__reExport(employee_exports, require("./employee-timeline.cjs"), module.exports);
__reExport(employee_exports, require("./employee-stats.cjs"), module.exports);
__reExport(employee_exports, require("./employee-empty-state.cjs"), module.exports);
__reExport(employee_exports, require("./employee-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./employee-overview.cjs"),
  ...require("./employee-card.cjs"),
  ...require("./employee-list.cjs"),
  ...require("./employee-table.cjs"),
  ...require("./employee-form.cjs"),
  ...require("./employee-filters.cjs"),
  ...require("./employee-timeline.cjs"),
  ...require("./employee-stats.cjs"),
  ...require("./employee-empty-state.cjs"),
  ...require("./employee-settings.cjs")
});
