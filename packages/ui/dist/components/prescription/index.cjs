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
var prescription_exports = {};
module.exports = __toCommonJS(prescription_exports);
__reExport(prescription_exports, require("./types.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-overview.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-card.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-list.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-table.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-form.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-filters.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-timeline.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-stats.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-empty-state.cjs"), module.exports);
__reExport(prescription_exports, require("./prescription-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./prescription-overview.cjs"),
  ...require("./prescription-card.cjs"),
  ...require("./prescription-list.cjs"),
  ...require("./prescription-table.cjs"),
  ...require("./prescription-form.cjs"),
  ...require("./prescription-filters.cjs"),
  ...require("./prescription-timeline.cjs"),
  ...require("./prescription-stats.cjs"),
  ...require("./prescription-empty-state.cjs"),
  ...require("./prescription-settings.cjs")
});
