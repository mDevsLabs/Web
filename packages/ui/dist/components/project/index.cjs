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
var project_exports = {};
module.exports = __toCommonJS(project_exports);
__reExport(project_exports, require("./types.cjs"), module.exports);
__reExport(project_exports, require("./project-overview.cjs"), module.exports);
__reExport(project_exports, require("./project-card.cjs"), module.exports);
__reExport(project_exports, require("./project-list.cjs"), module.exports);
__reExport(project_exports, require("./project-table.cjs"), module.exports);
__reExport(project_exports, require("./project-form.cjs"), module.exports);
__reExport(project_exports, require("./project-filters.cjs"), module.exports);
__reExport(project_exports, require("./project-timeline.cjs"), module.exports);
__reExport(project_exports, require("./project-stats.cjs"), module.exports);
__reExport(project_exports, require("./project-empty-state.cjs"), module.exports);
__reExport(project_exports, require("./project-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./project-overview.cjs"),
  ...require("./project-card.cjs"),
  ...require("./project-list.cjs"),
  ...require("./project-table.cjs"),
  ...require("./project-form.cjs"),
  ...require("./project-filters.cjs"),
  ...require("./project-timeline.cjs"),
  ...require("./project-stats.cjs"),
  ...require("./project-empty-state.cjs"),
  ...require("./project-settings.cjs")
});
