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
var goal_exports = {};
module.exports = __toCommonJS(goal_exports);
__reExport(goal_exports, require("./types.cjs"), module.exports);
__reExport(goal_exports, require("./goal-overview.cjs"), module.exports);
__reExport(goal_exports, require("./goal-card.cjs"), module.exports);
__reExport(goal_exports, require("./goal-list.cjs"), module.exports);
__reExport(goal_exports, require("./goal-table.cjs"), module.exports);
__reExport(goal_exports, require("./goal-form.cjs"), module.exports);
__reExport(goal_exports, require("./goal-filters.cjs"), module.exports);
__reExport(goal_exports, require("./goal-timeline.cjs"), module.exports);
__reExport(goal_exports, require("./goal-stats.cjs"), module.exports);
__reExport(goal_exports, require("./goal-empty-state.cjs"), module.exports);
__reExport(goal_exports, require("./goal-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./goal-overview.cjs"),
  ...require("./goal-card.cjs"),
  ...require("./goal-list.cjs"),
  ...require("./goal-table.cjs"),
  ...require("./goal-form.cjs"),
  ...require("./goal-filters.cjs"),
  ...require("./goal-timeline.cjs"),
  ...require("./goal-stats.cjs"),
  ...require("./goal-empty-state.cjs"),
  ...require("./goal-settings.cjs")
});
