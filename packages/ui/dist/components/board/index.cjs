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
var board_exports = {};
module.exports = __toCommonJS(board_exports);
__reExport(board_exports, require("./types.cjs"), module.exports);
__reExport(board_exports, require("./board-overview.cjs"), module.exports);
__reExport(board_exports, require("./board-card.cjs"), module.exports);
__reExport(board_exports, require("./board-list.cjs"), module.exports);
__reExport(board_exports, require("./board-table.cjs"), module.exports);
__reExport(board_exports, require("./board-form.cjs"), module.exports);
__reExport(board_exports, require("./board-filters.cjs"), module.exports);
__reExport(board_exports, require("./board-timeline.cjs"), module.exports);
__reExport(board_exports, require("./board-stats.cjs"), module.exports);
__reExport(board_exports, require("./board-empty-state.cjs"), module.exports);
__reExport(board_exports, require("./board-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./board-overview.cjs"),
  ...require("./board-card.cjs"),
  ...require("./board-list.cjs"),
  ...require("./board-table.cjs"),
  ...require("./board-form.cjs"),
  ...require("./board-filters.cjs"),
  ...require("./board-timeline.cjs"),
  ...require("./board-stats.cjs"),
  ...require("./board-empty-state.cjs"),
  ...require("./board-settings.cjs")
});
