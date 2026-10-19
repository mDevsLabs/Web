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
var config_exports = {};
__export(config_exports, {
  config: () => config
});
module.exports = __toCommonJS(config_exports);
const config = { "name": "Nutrition", "label": "Suivi nutritionnel", "description": "G\xE9rez vos suivi nutritionnel depuis une interface claire.", "fields": [{ "key": "meal", "label": "Repas", "kind": "text", "required": true }, { "key": "food", "label": "Aliment", "kind": "text", "required": true }, { "key": "calories", "label": "Calories", "kind": "number", "required": true }, { "key": "proteinGrams", "label": "Prot\xE9ines (g)", "kind": "number", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["planned", "logged", "archived"] }], "titleKey": "meal", "settings": [{ "key": "notifyNutrition", "label": "Notifications : suivi nutritionnel", "description": "Recevoir un signal lors des changements." }, { "key": "archiveNutrition", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section suivi nutritionnel." }, { "key": "approveNutrition", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
