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
var assignment_exports = {};
module.exports = __toCommonJS(assignment_exports);
__reExport(assignment_exports, require("./types.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-overview.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-card.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-list.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-table.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-form.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-filters.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-timeline.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-stats.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-empty-state.cjs"), module.exports);
__reExport(assignment_exports, require("./assignment-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./assignment-overview.cjs"),
  ...require("./assignment-card.cjs"),
  ...require("./assignment-list.cjs"),
  ...require("./assignment-table.cjs"),
  ...require("./assignment-form.cjs"),
  ...require("./assignment-filters.cjs"),
  ...require("./assignment-timeline.cjs"),
  ...require("./assignment-stats.cjs"),
  ...require("./assignment-empty-state.cjs"),
  ...require("./assignment-settings.cjs")
});
