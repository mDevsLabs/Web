"use client";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var circle_fading_arrow_up_exports = {};
__export(circle_fading_arrow_up_exports, {
  CircleFadingArrowUpIcon: () => CircleFadingArrowUpIcon
});
module.exports = __toCommonJS(circle_fading_arrow_up_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleFadingArrowUpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleFadingArrowUpIcon", [["path", { "d": "M12 2a10 10 0 0 1 7.38 16.75" }], ["path", { "d": "m16 12-4-4-4 4" }], ["path", { "d": "M12 16V8" }], ["path", { "d": "M2.5 8.875a10 10 0 0 0-.5 3" }], ["path", { "d": "M2.83 16a10 10 0 0 0 2.43 3.4" }], ["path", { "d": "M4.636 5.235a10 10 0 0 1 .891-.857" }], ["path", { "d": "M8.644 21.42a10 10 0 0 0 7.631-.38" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleFadingArrowUpIcon
});
