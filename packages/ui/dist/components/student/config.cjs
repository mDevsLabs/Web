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
const config = { "name": "Student", "label": "Apprenants", "description": "G\xE9rez vos apprenants depuis une interface claire.", "fields": [{ "key": "name", "label": "Nom", "kind": "text", "required": true }, { "key": "email", "label": "E-mail", "kind": "email", "required": true }, { "key": "courseCount", "label": "Formations", "kind": "number", "required": true }, { "key": "joinedOn", "label": "Inscription", "kind": "date", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["active", "graduated", "inactive"] }], "titleKey": "name", "settings": [{ "key": "notifyStudent", "label": "Notifications : apprenants", "description": "Recevoir un signal lors des changements." }, { "key": "archiveStudent", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section apprenants." }, { "key": "approveStudent", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
