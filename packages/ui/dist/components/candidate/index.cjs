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
var candidate_exports = {};
module.exports = __toCommonJS(candidate_exports);
__reExport(candidate_exports, require("./types.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-overview.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-card.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-list.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-table.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-form.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-filters.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-timeline.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-stats.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-empty-state.cjs"), module.exports);
__reExport(candidate_exports, require("./candidate-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./candidate-overview.cjs"),
  ...require("./candidate-card.cjs"),
  ...require("./candidate-list.cjs"),
  ...require("./candidate-table.cjs"),
  ...require("./candidate-form.cjs"),
  ...require("./candidate-filters.cjs"),
  ...require("./candidate-timeline.cjs"),
  ...require("./candidate-stats.cjs"),
  ...require("./candidate-empty-state.cjs"),
  ...require("./candidate-settings.cjs")
});
