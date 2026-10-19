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
const config = { "name": "TablePreset", "label": "Vues de table", "description": "G\xE9rez vos vues de table depuis une interface claire.", "fields": [{ "key": "name", "label": "Nom", "kind": "text", "required": true }, { "key": "owner", "label": "Propri\xE9taire", "kind": "text", "required": true }, { "key": "columnCount", "label": "Colonnes", "kind": "number", "required": true }, { "key": "pageSize", "label": "Lignes par page", "kind": "number", "required": true }, { "key": "updatedAt", "label": "Mise \xE0 jour", "kind": "date", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["draft", "active", "shared", "archived"] }], "titleKey": "name", "settings": [{ "key": "notifyTablePreset", "label": "Notifications : vues de table", "description": "Recevoir un signal lors des changements." }, { "key": "archiveTablePreset", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section vues de table." }, { "key": "approveTablePreset", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
