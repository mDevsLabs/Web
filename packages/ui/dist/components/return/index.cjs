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
var return_exports = {};
module.exports = __toCommonJS(return_exports);
__reExport(return_exports, require("./types.cjs"), module.exports);
__reExport(return_exports, require("./return-overview.cjs"), module.exports);
__reExport(return_exports, require("./return-card.cjs"), module.exports);
__reExport(return_exports, require("./return-list.cjs"), module.exports);
__reExport(return_exports, require("./return-table.cjs"), module.exports);
__reExport(return_exports, require("./return-form.cjs"), module.exports);
__reExport(return_exports, require("./return-filters.cjs"), module.exports);
__reExport(return_exports, require("./return-timeline.cjs"), module.exports);
__reExport(return_exports, require("./return-stats.cjs"), module.exports);
__reExport(return_exports, require("./return-empty-state.cjs"), module.exports);
__reExport(return_exports, require("./return-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./return-overview.cjs"),
  ...require("./return-card.cjs"),
  ...require("./return-list.cjs"),
  ...require("./return-table.cjs"),
  ...require("./return-form.cjs"),
  ...require("./return-filters.cjs"),
  ...require("./return-timeline.cjs"),
  ...require("./return-stats.cjs"),
  ...require("./return-empty-state.cjs"),
  ...require("./return-settings.cjs")
});
