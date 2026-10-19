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
var knowledge_article_exports = {};
module.exports = __toCommonJS(knowledge_article_exports);
__reExport(knowledge_article_exports, require("./types.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-overview.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-card.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-list.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-table.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-form.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-filters.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-timeline.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-stats.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-empty-state.cjs"), module.exports);
__reExport(knowledge_article_exports, require("./knowledge-article-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./knowledge-article-overview.cjs"),
  ...require("./knowledge-article-card.cjs"),
  ...require("./knowledge-article-list.cjs"),
  ...require("./knowledge-article-table.cjs"),
  ...require("./knowledge-article-form.cjs"),
  ...require("./knowledge-article-filters.cjs"),
  ...require("./knowledge-article-timeline.cjs"),
  ...require("./knowledge-article-stats.cjs"),
  ...require("./knowledge-article-empty-state.cjs"),
  ...require("./knowledge-article-settings.cjs")
});
