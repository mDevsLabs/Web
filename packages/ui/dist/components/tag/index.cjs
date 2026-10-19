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
var tag_exports = {};
module.exports = __toCommonJS(tag_exports);
__reExport(tag_exports, require("./types.cjs"), module.exports);
__reExport(tag_exports, require("./tag-overview.cjs"), module.exports);
__reExport(tag_exports, require("./tag-card.cjs"), module.exports);
__reExport(tag_exports, require("./tag-list.cjs"), module.exports);
__reExport(tag_exports, require("./tag-table.cjs"), module.exports);
__reExport(tag_exports, require("./tag-form.cjs"), module.exports);
__reExport(tag_exports, require("./tag-filters.cjs"), module.exports);
__reExport(tag_exports, require("./tag-timeline.cjs"), module.exports);
__reExport(tag_exports, require("./tag-stats.cjs"), module.exports);
__reExport(tag_exports, require("./tag-empty-state.cjs"), module.exports);
__reExport(tag_exports, require("./tag-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./tag-overview.cjs"),
  ...require("./tag-card.cjs"),
  ...require("./tag-list.cjs"),
  ...require("./tag-table.cjs"),
  ...require("./tag-form.cjs"),
  ...require("./tag-filters.cjs"),
  ...require("./tag-timeline.cjs"),
  ...require("./tag-stats.cjs"),
  ...require("./tag-empty-state.cjs"),
  ...require("./tag-settings.cjs")
});
