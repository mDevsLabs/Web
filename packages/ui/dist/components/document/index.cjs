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
var document_exports = {};
module.exports = __toCommonJS(document_exports);
__reExport(document_exports, require("./types.cjs"), module.exports);
__reExport(document_exports, require("./document-overview.cjs"), module.exports);
__reExport(document_exports, require("./document-card.cjs"), module.exports);
__reExport(document_exports, require("./document-list.cjs"), module.exports);
__reExport(document_exports, require("./document-table.cjs"), module.exports);
__reExport(document_exports, require("./document-form.cjs"), module.exports);
__reExport(document_exports, require("./document-filters.cjs"), module.exports);
__reExport(document_exports, require("./document-timeline.cjs"), module.exports);
__reExport(document_exports, require("./document-stats.cjs"), module.exports);
__reExport(document_exports, require("./document-empty-state.cjs"), module.exports);
__reExport(document_exports, require("./document-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./document-overview.cjs"),
  ...require("./document-card.cjs"),
  ...require("./document-list.cjs"),
  ...require("./document-table.cjs"),
  ...require("./document-form.cjs"),
  ...require("./document-filters.cjs"),
  ...require("./document-timeline.cjs"),
  ...require("./document-stats.cjs"),
  ...require("./document-empty-state.cjs"),
  ...require("./document-settings.cjs")
});
