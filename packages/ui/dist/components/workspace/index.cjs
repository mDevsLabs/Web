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
var workspace_exports = {};
module.exports = __toCommonJS(workspace_exports);
__reExport(workspace_exports, require("./types.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-overview.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-card.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-list.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-table.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-form.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-filters.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-timeline.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-stats.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-empty-state.cjs"), module.exports);
__reExport(workspace_exports, require("./workspace-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./workspace-overview.cjs"),
  ...require("./workspace-card.cjs"),
  ...require("./workspace-list.cjs"),
  ...require("./workspace-table.cjs"),
  ...require("./workspace-form.cjs"),
  ...require("./workspace-filters.cjs"),
  ...require("./workspace-timeline.cjs"),
  ...require("./workspace-stats.cjs"),
  ...require("./workspace-empty-state.cjs"),
  ...require("./workspace-settings.cjs")
});
