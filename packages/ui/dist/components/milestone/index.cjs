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
var milestone_exports = {};
module.exports = __toCommonJS(milestone_exports);
__reExport(milestone_exports, require("./types.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-overview.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-card.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-list.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-table.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-form.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-filters.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-timeline.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-stats.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-empty-state.cjs"), module.exports);
__reExport(milestone_exports, require("./milestone-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./milestone-overview.cjs"),
  ...require("./milestone-card.cjs"),
  ...require("./milestone-list.cjs"),
  ...require("./milestone-table.cjs"),
  ...require("./milestone-form.cjs"),
  ...require("./milestone-filters.cjs"),
  ...require("./milestone-timeline.cjs"),
  ...require("./milestone-stats.cjs"),
  ...require("./milestone-empty-state.cjs"),
  ...require("./milestone-settings.cjs")
});
