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
var medical_appointment_exports = {};
module.exports = __toCommonJS(medical_appointment_exports);
__reExport(medical_appointment_exports, require("./types.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-overview.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-card.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-list.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-table.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-form.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-filters.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-timeline.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-stats.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-empty-state.cjs"), module.exports);
__reExport(medical_appointment_exports, require("./medical-appointment-settings.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./types.cjs"),
  ...require("./medical-appointment-overview.cjs"),
  ...require("./medical-appointment-card.cjs"),
  ...require("./medical-appointment-list.cjs"),
  ...require("./medical-appointment-table.cjs"),
  ...require("./medical-appointment-form.cjs"),
  ...require("./medical-appointment-filters.cjs"),
  ...require("./medical-appointment-timeline.cjs"),
  ...require("./medical-appointment-stats.cjs"),
  ...require("./medical-appointment-empty-state.cjs"),
  ...require("./medical-appointment-settings.cjs")
});
