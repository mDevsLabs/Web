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
var api_endpoint_exports = {};
module.exports = __toCommonJS(api_endpoint_exports);
__reExport(api_endpoint_exports, require("./types.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-overview.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-card.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-list.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-table.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-form.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-filters.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-timeline.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-stats.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-empty-state.cjs"), module.exports);
__reExport(api_endpoint_exports, require("./api-endpoint-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./api-endpoint-overview.cjs"),
  ...require("./api-endpoint-card.cjs"),
  ...require("./api-endpoint-list.cjs"),
  ...require("./api-endpoint-table.cjs"),
  ...require("./api-endpoint-form.cjs"),
  ...require("./api-endpoint-filters.cjs"),
  ...require("./api-endpoint-timeline.cjs"),
  ...require("./api-endpoint-stats.cjs"),
  ...require("./api-endpoint-empty-state.cjs"),
  ...require("./api-endpoint-settings.cjs")
});
