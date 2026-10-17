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
var shipment_exports = {};
module.exports = __toCommonJS(shipment_exports);
__reExport(shipment_exports, require("./types.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-overview.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-card.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-list.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-table.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-form.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-filters.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-timeline.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-stats.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-empty-state.cjs"), module.exports);
__reExport(shipment_exports, require("./shipment-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./shipment-overview.cjs"),
  ...require("./shipment-card.cjs"),
  ...require("./shipment-list.cjs"),
  ...require("./shipment-table.cjs"),
  ...require("./shipment-form.cjs"),
  ...require("./shipment-filters.cjs"),
  ...require("./shipment-timeline.cjs"),
  ...require("./shipment-stats.cjs"),
  ...require("./shipment-empty-state.cjs"),
  ...require("./shipment-settings.cjs")
});
