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
var support_ticket_exports = {};
module.exports = __toCommonJS(support_ticket_exports);
__reExport(support_ticket_exports, require("./types.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-overview.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-card.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-list.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-table.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-form.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-filters.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-timeline.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-stats.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-empty-state.cjs"), module.exports);
__reExport(support_ticket_exports, require("./support-ticket-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./support-ticket-overview.cjs"),
  ...require("./support-ticket-card.cjs"),
  ...require("./support-ticket-list.cjs"),
  ...require("./support-ticket-table.cjs"),
  ...require("./support-ticket-form.cjs"),
  ...require("./support-ticket-filters.cjs"),
  ...require("./support-ticket-timeline.cjs"),
  ...require("./support-ticket-stats.cjs"),
  ...require("./support-ticket-empty-state.cjs"),
  ...require("./support-ticket-settings.cjs")
});
