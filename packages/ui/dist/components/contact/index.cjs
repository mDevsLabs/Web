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
var contact_exports = {};
module.exports = __toCommonJS(contact_exports);
__reExport(contact_exports, require("./types.cjs"), module.exports);
__reExport(contact_exports, require("./contact-overview.cjs"), module.exports);
__reExport(contact_exports, require("./contact-card.cjs"), module.exports);
__reExport(contact_exports, require("./contact-list.cjs"), module.exports);
__reExport(contact_exports, require("./contact-table.cjs"), module.exports);
__reExport(contact_exports, require("./contact-form.cjs"), module.exports);
__reExport(contact_exports, require("./contact-filters.cjs"), module.exports);
__reExport(contact_exports, require("./contact-timeline.cjs"), module.exports);
__reExport(contact_exports, require("./contact-stats.cjs"), module.exports);
__reExport(contact_exports, require("./contact-empty-state.cjs"), module.exports);
__reExport(contact_exports, require("./contact-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./contact-overview.cjs"),
  ...require("./contact-card.cjs"),
  ...require("./contact-list.cjs"),
  ...require("./contact-table.cjs"),
  ...require("./contact-form.cjs"),
  ...require("./contact-filters.cjs"),
  ...require("./contact-timeline.cjs"),
  ...require("./contact-stats.cjs"),
  ...require("./contact-empty-state.cjs"),
  ...require("./contact-settings.cjs")
});
