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
var exam_exports = {};
module.exports = __toCommonJS(exam_exports);
__reExport(exam_exports, require("./types.cjs"), module.exports);
__reExport(exam_exports, require("./exam-overview.cjs"), module.exports);
__reExport(exam_exports, require("./exam-card.cjs"), module.exports);
__reExport(exam_exports, require("./exam-list.cjs"), module.exports);
__reExport(exam_exports, require("./exam-table.cjs"), module.exports);
__reExport(exam_exports, require("./exam-form.cjs"), module.exports);
__reExport(exam_exports, require("./exam-filters.cjs"), module.exports);
__reExport(exam_exports, require("./exam-timeline.cjs"), module.exports);
__reExport(exam_exports, require("./exam-stats.cjs"), module.exports);
__reExport(exam_exports, require("./exam-empty-state.cjs"), module.exports);
__reExport(exam_exports, require("./exam-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./exam-overview.cjs"),
  ...require("./exam-card.cjs"),
  ...require("./exam-list.cjs"),
  ...require("./exam-table.cjs"),
  ...require("./exam-form.cjs"),
  ...require("./exam-filters.cjs"),
  ...require("./exam-timeline.cjs"),
  ...require("./exam-stats.cjs"),
  ...require("./exam-empty-state.cjs"),
  ...require("./exam-settings.cjs")
});
