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
const config = { "name": "RestaurantMenu", "label": "Menus de restaurant", "description": "G\xE9rez vos menus de restaurant depuis une interface claire.", "fields": [{ "key": "name", "label": "Nom", "kind": "text", "required": true }, { "key": "restaurant", "label": "Restaurant", "kind": "text", "required": true }, { "key": "dishCount", "label": "Plats", "kind": "number", "required": true }, { "key": "averagePrice", "label": "Prix moyen", "kind": "number", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["draft", "active", "seasonal"] }], "titleKey": "name", "settings": [{ "key": "notifyRestaurantMenu", "label": "Notifications : menus de restaurant", "description": "Recevoir un signal lors des changements." }, { "key": "archiveRestaurantMenu", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section menus de restaurant." }, { "key": "approveRestaurantMenu", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
