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
var quote_exports = {};
module.exports = __toCommonJS(quote_exports);
__reExport(quote_exports, require("./types.cjs"), module.exports);
__reExport(quote_exports, require("./quote-overview.cjs"), module.exports);
__reExport(quote_exports, require("./quote-card.cjs"), module.exports);
__reExport(quote_exports, require("./quote-list.cjs"), module.exports);
__reExport(quote_exports, require("./quote-table.cjs"), module.exports);
__reExport(quote_exports, require("./quote-form.cjs"), module.exports);
__reExport(quote_exports, require("./quote-filters.cjs"), module.exports);
__reExport(quote_exports, require("./quote-timeline.cjs"), module.exports);
__reExport(quote_exports, require("./quote-stats.cjs"), module.exports);
__reExport(quote_exports, require("./quote-empty-state.cjs"), module.exports);
__reExport(quote_exports, require("./quote-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./quote-overview.cjs"),
  ...require("./quote-card.cjs"),
  ...require("./quote-list.cjs"),
  ...require("./quote-table.cjs"),
  ...require("./quote-form.cjs"),
  ...require("./quote-filters.cjs"),
  ...require("./quote-timeline.cjs"),
  ...require("./quote-stats.cjs"),
  ...require("./quote-empty-state.cjs"),
  ...require("./quote-settings.cjs")
});
