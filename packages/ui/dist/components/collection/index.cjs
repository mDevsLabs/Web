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
var collection_exports = {};
module.exports = __toCommonJS(collection_exports);
__reExport(collection_exports, require("./types.cjs"), module.exports);
__reExport(collection_exports, require("./collection-overview.cjs"), module.exports);
__reExport(collection_exports, require("./collection-card.cjs"), module.exports);
__reExport(collection_exports, require("./collection-list.cjs"), module.exports);
__reExport(collection_exports, require("./collection-table.cjs"), module.exports);
__reExport(collection_exports, require("./collection-form.cjs"), module.exports);
__reExport(collection_exports, require("./collection-filters.cjs"), module.exports);
__reExport(collection_exports, require("./collection-timeline.cjs"), module.exports);
__reExport(collection_exports, require("./collection-stats.cjs"), module.exports);
__reExport(collection_exports, require("./collection-empty-state.cjs"), module.exports);
__reExport(collection_exports, require("./collection-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./collection-overview.cjs"),
  ...require("./collection-card.cjs"),
  ...require("./collection-list.cjs"),
  ...require("./collection-table.cjs"),
  ...require("./collection-form.cjs"),
  ...require("./collection-filters.cjs"),
  ...require("./collection-timeline.cjs"),
  ...require("./collection-stats.cjs"),
  ...require("./collection-empty-state.cjs"),
  ...require("./collection-settings.cjs")
});
