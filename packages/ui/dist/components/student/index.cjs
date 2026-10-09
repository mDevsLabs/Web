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
var student_exports = {};
module.exports = __toCommonJS(student_exports);
__reExport(student_exports, require("./types.cjs"), module.exports);
__reExport(student_exports, require("./student-overview.cjs"), module.exports);
__reExport(student_exports, require("./student-card.cjs"), module.exports);
__reExport(student_exports, require("./student-list.cjs"), module.exports);
__reExport(student_exports, require("./student-table.cjs"), module.exports);
__reExport(student_exports, require("./student-form.cjs"), module.exports);
__reExport(student_exports, require("./student-filters.cjs"), module.exports);
__reExport(student_exports, require("./student-timeline.cjs"), module.exports);
__reExport(student_exports, require("./student-stats.cjs"), module.exports);
__reExport(student_exports, require("./student-empty-state.cjs"), module.exports);
__reExport(student_exports, require("./student-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./student-overview.cjs"),
  ...require("./student-card.cjs"),
  ...require("./student-list.cjs"),
  ...require("./student-table.cjs"),
  ...require("./student-form.cjs"),
  ...require("./student-filters.cjs"),
  ...require("./student-timeline.cjs"),
  ...require("./student-stats.cjs"),
  ...require("./student-empty-state.cjs"),
  ...require("./student-settings.cjs")
});
