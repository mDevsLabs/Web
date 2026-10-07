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
var comment_exports = {};
module.exports = __toCommonJS(comment_exports);
__reExport(comment_exports, require("./types.cjs"), module.exports);
__reExport(comment_exports, require("./comment-overview.cjs"), module.exports);
__reExport(comment_exports, require("./comment-card.cjs"), module.exports);
__reExport(comment_exports, require("./comment-list.cjs"), module.exports);
__reExport(comment_exports, require("./comment-table.cjs"), module.exports);
__reExport(comment_exports, require("./comment-form.cjs"), module.exports);
__reExport(comment_exports, require("./comment-filters.cjs"), module.exports);
__reExport(comment_exports, require("./comment-timeline.cjs"), module.exports);
__reExport(comment_exports, require("./comment-stats.cjs"), module.exports);
__reExport(comment_exports, require("./comment-empty-state.cjs"), module.exports);
__reExport(comment_exports, require("./comment-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./comment-overview.cjs"),
  ...require("./comment-card.cjs"),
  ...require("./comment-list.cjs"),
  ...require("./comment-table.cjs"),
  ...require("./comment-form.cjs"),
  ...require("./comment-filters.cjs"),
  ...require("./comment-timeline.cjs"),
  ...require("./comment-stats.cjs"),
  ...require("./comment-empty-state.cjs"),
  ...require("./comment-settings.cjs")
});
