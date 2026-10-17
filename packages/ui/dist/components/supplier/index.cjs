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
var supplier_exports = {};
module.exports = __toCommonJS(supplier_exports);
__reExport(supplier_exports, require("./types.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-overview.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-card.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-list.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-table.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-form.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-filters.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-timeline.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-stats.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-empty-state.cjs"), module.exports);
__reExport(supplier_exports, require("./supplier-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./supplier-overview.cjs"),
  ...require("./supplier-card.cjs"),
  ...require("./supplier-list.cjs"),
  ...require("./supplier-table.cjs"),
  ...require("./supplier-form.cjs"),
  ...require("./supplier-filters.cjs"),
  ...require("./supplier-timeline.cjs"),
  ...require("./supplier-stats.cjs"),
  ...require("./supplier-empty-state.cjs"),
  ...require("./supplier-settings.cjs")
});
