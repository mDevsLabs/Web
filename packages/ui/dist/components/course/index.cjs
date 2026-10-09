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
var course_exports = {};
module.exports = __toCommonJS(course_exports);
__reExport(course_exports, require("./types.cjs"), module.exports);
__reExport(course_exports, require("./course-overview.cjs"), module.exports);
__reExport(course_exports, require("./course-card.cjs"), module.exports);
__reExport(course_exports, require("./course-list.cjs"), module.exports);
__reExport(course_exports, require("./course-table.cjs"), module.exports);
__reExport(course_exports, require("./course-form.cjs"), module.exports);
__reExport(course_exports, require("./course-filters.cjs"), module.exports);
__reExport(course_exports, require("./course-timeline.cjs"), module.exports);
__reExport(course_exports, require("./course-stats.cjs"), module.exports);
__reExport(course_exports, require("./course-empty-state.cjs"), module.exports);
__reExport(course_exports, require("./course-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./course-overview.cjs"),
  ...require("./course-card.cjs"),
  ...require("./course-list.cjs"),
  ...require("./course-table.cjs"),
  ...require("./course-form.cjs"),
  ...require("./course-filters.cjs"),
  ...require("./course-timeline.cjs"),
  ...require("./course-stats.cjs"),
  ...require("./course-empty-state.cjs"),
  ...require("./course-settings.cjs")
});
