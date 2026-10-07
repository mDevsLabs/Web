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
var nutrition_exports = {};
module.exports = __toCommonJS(nutrition_exports);
__reExport(nutrition_exports, require("./types.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-overview.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-card.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-list.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-table.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-form.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-filters.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-timeline.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-stats.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-empty-state.cjs"), module.exports);
__reExport(nutrition_exports, require("./nutrition-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./nutrition-overview.cjs"),
  ...require("./nutrition-card.cjs"),
  ...require("./nutrition-list.cjs"),
  ...require("./nutrition-table.cjs"),
  ...require("./nutrition-form.cjs"),
  ...require("./nutrition-filters.cjs"),
  ...require("./nutrition-timeline.cjs"),
  ...require("./nutrition-stats.cjs"),
  ...require("./nutrition-empty-state.cjs"),
  ...require("./nutrition-settings.cjs")
});
