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
const config = { "name": "Assignment", "label": "Travaux \xE0 rendre", "description": "G\xE9rez vos travaux \xE0 rendre depuis une interface claire.", "fields": [{ "key": "title", "label": "Titre", "kind": "text", "required": true }, { "key": "course", "label": "Formation", "kind": "text", "required": true }, { "key": "dueDate", "label": "\xC9ch\xE9ance", "kind": "date", "required": true }, { "key": "maxScore", "label": "Note maximale", "kind": "number", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["draft", "open", "closed"] }], "titleKey": "title", "settings": [{ "key": "notifyAssignment", "label": "Notifications : travaux \xE0 rendre", "description": "Recevoir un signal lors des changements." }, { "key": "archiveAssignment", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section travaux \xE0 rendre." }, { "key": "approveAssignment", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
