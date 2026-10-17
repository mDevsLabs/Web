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
var audience_exports = {};
module.exports = __toCommonJS(audience_exports);
__reExport(audience_exports, require("./types.cjs"), module.exports);
__reExport(audience_exports, require("./audience-overview.cjs"), module.exports);
__reExport(audience_exports, require("./audience-card.cjs"), module.exports);
__reExport(audience_exports, require("./audience-list.cjs"), module.exports);
__reExport(audience_exports, require("./audience-table.cjs"), module.exports);
__reExport(audience_exports, require("./audience-form.cjs"), module.exports);
__reExport(audience_exports, require("./audience-filters.cjs"), module.exports);
__reExport(audience_exports, require("./audience-timeline.cjs"), module.exports);
__reExport(audience_exports, require("./audience-stats.cjs"), module.exports);
__reExport(audience_exports, require("./audience-empty-state.cjs"), module.exports);
__reExport(audience_exports, require("./audience-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./audience-overview.cjs"),
  ...require("./audience-card.cjs"),
  ...require("./audience-list.cjs"),
  ...require("./audience-table.cjs"),
  ...require("./audience-form.cjs"),
  ...require("./audience-filters.cjs"),
  ...require("./audience-timeline.cjs"),
  ...require("./audience-stats.cjs"),
  ...require("./audience-empty-state.cjs"),
  ...require("./audience-settings.cjs")
});
