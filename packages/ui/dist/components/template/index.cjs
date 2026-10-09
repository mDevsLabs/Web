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
var template_exports = {};
module.exports = __toCommonJS(template_exports);
__reExport(template_exports, require("./types.cjs"), module.exports);
__reExport(template_exports, require("./template-overview.cjs"), module.exports);
__reExport(template_exports, require("./template-card.cjs"), module.exports);
__reExport(template_exports, require("./template-list.cjs"), module.exports);
__reExport(template_exports, require("./template-table.cjs"), module.exports);
__reExport(template_exports, require("./template-form.cjs"), module.exports);
__reExport(template_exports, require("./template-filters.cjs"), module.exports);
__reExport(template_exports, require("./template-timeline.cjs"), module.exports);
__reExport(template_exports, require("./template-stats.cjs"), module.exports);
__reExport(template_exports, require("./template-empty-state.cjs"), module.exports);
__reExport(template_exports, require("./template-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./template-overview.cjs"),
  ...require("./template-card.cjs"),
  ...require("./template-list.cjs"),
  ...require("./template-table.cjs"),
  ...require("./template-form.cjs"),
  ...require("./template-filters.cjs"),
  ...require("./template-timeline.cjs"),
  ...require("./template-stats.cjs"),
  ...require("./template-empty-state.cjs"),
  ...require("./template-settings.cjs")
});
