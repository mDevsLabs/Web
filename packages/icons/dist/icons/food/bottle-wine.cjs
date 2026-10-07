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
var bottle_wine_exports = {};
__export(bottle_wine_exports, {
  BottleWineIcon: () => BottleWineIcon
});
module.exports = __toCommonJS(bottle_wine_exports);
var import_create_icon = require("../../create-icon.cjs");
const BottleWineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BottleWineIcon", [["path", { "d": "M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a6 6 0 0 0 1.2 3.6l.6.8A6 6 0 0 1 17 13v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8a6 6 0 0 1 1.2-3.6l.6-.8A6 6 0 0 0 10 5z" }], ["path", { "d": "M17 13h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BottleWineIcon
});
