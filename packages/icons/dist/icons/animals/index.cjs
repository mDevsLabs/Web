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
var animals_exports = {};
__export(animals_exports, {
  BatIcon: () => import_bat.BatIcon,
  BirdIcon: () => import_bird.BirdIcon,
  CatIcon: () => import_cat.CatIcon,
  DogIcon: () => import_dog.DogIcon,
  FishBoneIcon: () => import_fish_bone.FishBoneIcon,
  FishChristianityIcon: () => import_fish_christianity.FishChristianityIcon,
  FishHookIcon: () => import_fish_hook.FishHookIcon,
  FishHookOffIcon: () => import_fish_hook_off.FishHookOffIcon,
  FishIcon: () => import_fish.FishIcon,
  FishOffIcon: () => import_fish_off.FishOffIcon,
  FishSymbolIcon: () => import_fish_symbol.FishSymbolIcon,
  PawIcon: () => import_paw.PawIcon,
  PawOffIcon: () => import_paw_off.PawOffIcon,
  PawPrintIcon: () => import_paw_print.PawPrintIcon,
  RabbitIcon: () => import_rabbit.RabbitIcon,
  SquirrelIcon: () => import_squirrel.SquirrelIcon,
  TurtleIcon: () => import_turtle.TurtleIcon
});
module.exports = __toCommonJS(animals_exports);
var import_bat = require("./bat.cjs");
var import_bird = require("./bird.cjs");
var import_cat = require("./cat.cjs");
var import_dog = require("./dog.cjs");
var import_fish = require("./fish.cjs");
var import_fish_bone = require("./fish-bone.cjs");
var import_fish_christianity = require("./fish-christianity.cjs");
var import_fish_hook = require("./fish-hook.cjs");
var import_fish_hook_off = require("./fish-hook-off.cjs");
var import_fish_off = require("./fish-off.cjs");
var import_fish_symbol = require("./fish-symbol.cjs");
var import_paw = require("./paw.cjs");
var import_paw_off = require("./paw-off.cjs");
var import_paw_print = require("./paw-print.cjs");
var import_rabbit = require("./rabbit.cjs");
var import_squirrel = require("./squirrel.cjs");
var import_turtle = require("./turtle.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatIcon,
  BirdIcon,
  CatIcon,
  DogIcon,
  FishBoneIcon,
  FishChristianityIcon,
  FishHookIcon,
  FishHookOffIcon,
  FishIcon,
  FishOffIcon,
  FishSymbolIcon,
  PawIcon,
  PawOffIcon,
  PawPrintIcon,
  RabbitIcon,
  SquirrelIcon,
  TurtleIcon
});
