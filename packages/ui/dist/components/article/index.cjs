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
var article_exports = {};
module.exports = __toCommonJS(article_exports);
__reExport(article_exports, require("./types.cjs"), module.exports);
__reExport(article_exports, require("./article-overview.cjs"), module.exports);
__reExport(article_exports, require("./article-card.cjs"), module.exports);
__reExport(article_exports, require("./article-list.cjs"), module.exports);
__reExport(article_exports, require("./article-table.cjs"), module.exports);
__reExport(article_exports, require("./article-form.cjs"), module.exports);
__reExport(article_exports, require("./article-filters.cjs"), module.exports);
__reExport(article_exports, require("./article-timeline.cjs"), module.exports);
__reExport(article_exports, require("./article-stats.cjs"), module.exports);
__reExport(article_exports, require("./article-empty-state.cjs"), module.exports);
__reExport(article_exports, require("./article-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./article-overview.cjs"),
  ...require("./article-card.cjs"),
  ...require("./article-list.cjs"),
  ...require("./article-table.cjs"),
  ...require("./article-form.cjs"),
  ...require("./article-filters.cjs"),
  ...require("./article-timeline.cjs"),
  ...require("./article-stats.cjs"),
  ...require("./article-empty-state.cjs"),
  ...require("./article-settings.cjs")
});
