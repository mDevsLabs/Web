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
var task_exports = {};
module.exports = __toCommonJS(task_exports);
__reExport(task_exports, require("./types.cjs"), module.exports);
__reExport(task_exports, require("./task-overview.cjs"), module.exports);
__reExport(task_exports, require("./task-card.cjs"), module.exports);
__reExport(task_exports, require("./task-list.cjs"), module.exports);
__reExport(task_exports, require("./task-table.cjs"), module.exports);
__reExport(task_exports, require("./task-form.cjs"), module.exports);
__reExport(task_exports, require("./task-filters.cjs"), module.exports);
__reExport(task_exports, require("./task-timeline.cjs"), module.exports);
__reExport(task_exports, require("./task-stats.cjs"), module.exports);
__reExport(task_exports, require("./task-empty-state.cjs"), module.exports);
__reExport(task_exports, require("./task-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./task-overview.cjs"),
  ...require("./task-card.cjs"),
  ...require("./task-list.cjs"),
  ...require("./task-table.cjs"),
  ...require("./task-form.cjs"),
  ...require("./task-filters.cjs"),
  ...require("./task-timeline.cjs"),
  ...require("./task-stats.cjs"),
  ...require("./task-empty-state.cjs"),
  ...require("./task-settings.cjs")
});
