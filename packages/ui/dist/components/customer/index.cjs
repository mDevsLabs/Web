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
var customer_exports = {};
module.exports = __toCommonJS(customer_exports);
__reExport(customer_exports, require("./types.cjs"), module.exports);
__reExport(customer_exports, require("./customer-overview.cjs"), module.exports);
__reExport(customer_exports, require("./customer-card.cjs"), module.exports);
__reExport(customer_exports, require("./customer-list.cjs"), module.exports);
__reExport(customer_exports, require("./customer-table.cjs"), module.exports);
__reExport(customer_exports, require("./customer-form.cjs"), module.exports);
__reExport(customer_exports, require("./customer-filters.cjs"), module.exports);
__reExport(customer_exports, require("./customer-timeline.cjs"), module.exports);
__reExport(customer_exports, require("./customer-stats.cjs"), module.exports);
__reExport(customer_exports, require("./customer-empty-state.cjs"), module.exports);
__reExport(customer_exports, require("./customer-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./customer-overview.cjs"),
  ...require("./customer-card.cjs"),
  ...require("./customer-list.cjs"),
  ...require("./customer-table.cjs"),
  ...require("./customer-form.cjs"),
  ...require("./customer-filters.cjs"),
  ...require("./customer-timeline.cjs"),
  ...require("./customer-stats.cjs"),
  ...require("./customer-empty-state.cjs"),
  ...require("./customer-settings.cjs")
});
