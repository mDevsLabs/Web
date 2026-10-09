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
var deal_exports = {};
module.exports = __toCommonJS(deal_exports);
__reExport(deal_exports, require("./types.cjs"), module.exports);
__reExport(deal_exports, require("./deal-overview.cjs"), module.exports);
__reExport(deal_exports, require("./deal-card.cjs"), module.exports);
__reExport(deal_exports, require("./deal-list.cjs"), module.exports);
__reExport(deal_exports, require("./deal-table.cjs"), module.exports);
__reExport(deal_exports, require("./deal-form.cjs"), module.exports);
__reExport(deal_exports, require("./deal-filters.cjs"), module.exports);
__reExport(deal_exports, require("./deal-timeline.cjs"), module.exports);
__reExport(deal_exports, require("./deal-stats.cjs"), module.exports);
__reExport(deal_exports, require("./deal-empty-state.cjs"), module.exports);
__reExport(deal_exports, require("./deal-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./deal-overview.cjs"),
  ...require("./deal-card.cjs"),
  ...require("./deal-list.cjs"),
  ...require("./deal-table.cjs"),
  ...require("./deal-form.cjs"),
  ...require("./deal-filters.cjs"),
  ...require("./deal-timeline.cjs"),
  ...require("./deal-stats.cjs"),
  ...require("./deal-empty-state.cjs"),
  ...require("./deal-settings.cjs")
});
