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
const config = { "name": "Workout", "label": "Entra\xEEnements", "description": "G\xE9rez vos entra\xEEnements depuis une interface claire.", "fields": [{ "key": "title", "label": "Titre", "kind": "text", "required": true }, { "key": "activity", "label": "Activit\xE9", "kind": "text", "required": true }, { "key": "durationMinutes", "label": "Dur\xE9e (min)", "kind": "number", "required": true }, { "key": "calories", "label": "Calories", "kind": "number", "required": true }, { "key": "status", "label": "Statut", "kind": "status", "required": true, "options": ["planned", "completed", "skipped"] }], "titleKey": "title", "settings": [{ "key": "notifyWorkout", "label": "Notifications : entra\xEEnements", "description": "Recevoir un signal lors des changements." }, { "key": "archiveWorkout", "label": "Archivage automatique", "description": "Archiver les \xE9l\xE9ments termin\xE9s de la section entra\xEEnements." }, { "key": "approveWorkout", "label": "Validation requise", "description": "Demander une validation avant publication ou activation." }] };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
