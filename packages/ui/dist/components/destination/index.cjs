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
var destination_exports = {};
module.exports = __toCommonJS(destination_exports);
__reExport(destination_exports, require("./types.cjs"), module.exports);
__reExport(destination_exports, require("./destination-overview.cjs"), module.exports);
__reExport(destination_exports, require("./destination-card.cjs"), module.exports);
__reExport(destination_exports, require("./destination-list.cjs"), module.exports);
__reExport(destination_exports, require("./destination-table.cjs"), module.exports);
__reExport(destination_exports, require("./destination-form.cjs"), module.exports);
__reExport(destination_exports, require("./destination-filters.cjs"), module.exports);
__reExport(destination_exports, require("./destination-timeline.cjs"), module.exports);
__reExport(destination_exports, require("./destination-stats.cjs"), module.exports);
__reExport(destination_exports, require("./destination-empty-state.cjs"), module.exports);
__reExport(destination_exports, require("./destination-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./destination-overview.cjs"),
  ...require("./destination-card.cjs"),
  ...require("./destination-list.cjs"),
  ...require("./destination-table.cjs"),
  ...require("./destination-form.cjs"),
  ...require("./destination-filters.cjs"),
  ...require("./destination-timeline.cjs"),
  ...require("./destination-stats.cjs"),
  ...require("./destination-empty-state.cjs"),
  ...require("./destination-settings.cjs")
});
