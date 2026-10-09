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
var tax_report_exports = {};
module.exports = __toCommonJS(tax_report_exports);
__reExport(tax_report_exports, require("./types.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-overview.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-card.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-list.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-table.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-form.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-filters.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-timeline.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-stats.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-empty-state.cjs"), module.exports);
__reExport(tax_report_exports, require("./tax-report-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./tax-report-overview.cjs"),
  ...require("./tax-report-card.cjs"),
  ...require("./tax-report-list.cjs"),
  ...require("./tax-report-table.cjs"),
  ...require("./tax-report-form.cjs"),
  ...require("./tax-report-filters.cjs"),
  ...require("./tax-report-timeline.cjs"),
  ...require("./tax-report-stats.cjs"),
  ...require("./tax-report-empty-state.cjs"),
  ...require("./tax-report-settings.cjs")
});
