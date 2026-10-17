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
var product_exports = {};
module.exports = __toCommonJS(product_exports);
__reExport(product_exports, require("./types.cjs"), module.exports);
__reExport(product_exports, require("./product-overview.cjs"), module.exports);
__reExport(product_exports, require("./product-card.cjs"), module.exports);
__reExport(product_exports, require("./product-list.cjs"), module.exports);
__reExport(product_exports, require("./product-table.cjs"), module.exports);
__reExport(product_exports, require("./product-form.cjs"), module.exports);
__reExport(product_exports, require("./product-filters.cjs"), module.exports);
__reExport(product_exports, require("./product-timeline.cjs"), module.exports);
__reExport(product_exports, require("./product-stats.cjs"), module.exports);
__reExport(product_exports, require("./product-empty-state.cjs"), module.exports);
__reExport(product_exports, require("./product-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./product-overview.cjs"),
  ...require("./product-card.cjs"),
  ...require("./product-list.cjs"),
  ...require("./product-table.cjs"),
  ...require("./product-form.cjs"),
  ...require("./product-filters.cjs"),
  ...require("./product-timeline.cjs"),
  ...require("./product-stats.cjs"),
  ...require("./product-empty-state.cjs"),
  ...require("./product-settings.cjs")
});
