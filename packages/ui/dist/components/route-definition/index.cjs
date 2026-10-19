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
var route_definition_exports = {};
module.exports = __toCommonJS(route_definition_exports);
__reExport(route_definition_exports, require("./types.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-overview.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-card.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-list.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-table.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-form.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-filters.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-timeline.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-stats.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-empty-state.cjs"), module.exports);
__reExport(route_definition_exports, require("./route-definition-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./route-definition-overview.cjs"),
  ...require("./route-definition-card.cjs"),
  ...require("./route-definition-list.cjs"),
  ...require("./route-definition-table.cjs"),
  ...require("./route-definition-form.cjs"),
  ...require("./route-definition-filters.cjs"),
  ...require("./route-definition-timeline.cjs"),
  ...require("./route-definition-stats.cjs"),
  ...require("./route-definition-empty-state.cjs"),
  ...require("./route-definition-settings.cjs")
});
