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
var fish_bone_exports = {};
__export(fish_bone_exports, {
  FishBoneIcon: () => FishBoneIcon
});
module.exports = __toCommonJS(fish_bone_exports);
var import_create_icon = require("../../create-icon.cjs");
const FishBoneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FishBoneIcon", [["path", { "d": "M16.69 7.44a6.973 6.973 0 0 0 -1.69 4.56a6.97 6.97 0 0 0 1.699 4.571c1.914 -.684 3.691 -2.183 5.301 -4.565c-1.613 -2.384 -3.394 -3.883 -5.312 -4.565" }], ["path", { "d": "M2 9.504a40.73 40.73 0 0 0 2.422 2.504a39.679 39.679 0 0 0 -2.422 2.498" }], ["path", { "d": "M18 11v.01" }], ["path", { "d": "M4.422 12h10.578" }], ["path", { "d": "M7 10v4" }], ["path", { "d": "M11 8v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FishBoneIcon
});
