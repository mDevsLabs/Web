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
var payroll_exports = {};
module.exports = __toCommonJS(payroll_exports);
__reExport(payroll_exports, require("./types.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-overview.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-card.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-list.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-table.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-form.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-filters.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-timeline.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-stats.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-empty-state.cjs"), module.exports);
__reExport(payroll_exports, require("./payroll-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./payroll-overview.cjs"),
  ...require("./payroll-card.cjs"),
  ...require("./payroll-list.cjs"),
  ...require("./payroll-table.cjs"),
  ...require("./payroll-form.cjs"),
  ...require("./payroll-filters.cjs"),
  ...require("./payroll-timeline.cjs"),
  ...require("./payroll-stats.cjs"),
  ...require("./payroll-empty-state.cjs"),
  ...require("./payroll-settings.cjs")
});
