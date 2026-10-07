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
var newsletter_exports = {};
module.exports = __toCommonJS(newsletter_exports);
__reExport(newsletter_exports, require("./types.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-overview.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-card.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-list.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-table.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-form.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-filters.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-timeline.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-stats.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-empty-state.cjs"), module.exports);
__reExport(newsletter_exports, require("./newsletter-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./newsletter-overview.cjs"),
  ...require("./newsletter-card.cjs"),
  ...require("./newsletter-list.cjs"),
  ...require("./newsletter-table.cjs"),
  ...require("./newsletter-form.cjs"),
  ...require("./newsletter-filters.cjs"),
  ...require("./newsletter-timeline.cjs"),
  ...require("./newsletter-stats.cjs"),
  ...require("./newsletter-empty-state.cjs"),
  ...require("./newsletter-settings.cjs")
});
