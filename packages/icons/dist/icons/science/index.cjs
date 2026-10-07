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
var science_exports = {};
__export(science_exports, {
  Atom2Icon: () => import_atom_2.Atom2Icon,
  AtomIcon: () => import_atom.AtomIcon,
  AtomOffIcon: () => import_atom_off.AtomOffIcon,
  BeakerIcon: () => import_beaker.BeakerIcon,
  Dna2Icon: () => import_dna_2.Dna2Icon,
  Dna2OffIcon: () => import_dna_2_off.Dna2OffIcon,
  DnaIcon: () => import_dna.DnaIcon,
  DnaOffIcon: () => import_dna_off.DnaOffIcon,
  FlaskConicalIcon: () => import_flask_conical.FlaskConicalIcon,
  FlaskConicalOffIcon: () => import_flask_conical_off.FlaskConicalOffIcon,
  FlaskRoundIcon: () => import_flask_round.FlaskRoundIcon,
  MagnetIcon: () => import_magnet.MagnetIcon,
  MicroscopeIcon: () => import_microscope.MicroscopeIcon,
  OrbitIcon: () => import_orbit.OrbitIcon,
  TelescopeIcon: () => import_telescope.TelescopeIcon,
  TestTube2Icon: () => import_test_tube_2.TestTube2Icon,
  TestTubeIcon: () => import_test_tube.TestTubeIcon
});
module.exports = __toCommonJS(science_exports);
var import_atom = require("./atom.cjs");
var import_atom_2 = require("./atom-2.cjs");
var import_atom_off = require("./atom-off.cjs");
var import_beaker = require("./beaker.cjs");
var import_dna = require("./dna.cjs");
var import_dna_2 = require("./dna-2.cjs");
var import_dna_2_off = require("./dna-2-off.cjs");
var import_dna_off = require("./dna-off.cjs");
var import_flask_conical = require("./flask-conical.cjs");
var import_flask_conical_off = require("./flask-conical-off.cjs");
var import_flask_round = require("./flask-round.cjs");
var import_magnet = require("./magnet.cjs");
var import_microscope = require("./microscope.cjs");
var import_orbit = require("./orbit.cjs");
var import_telescope = require("./telescope.cjs");
var import_test_tube = require("./test-tube.cjs");
var import_test_tube_2 = require("./test-tube-2.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Atom2Icon,
  AtomIcon,
  AtomOffIcon,
  BeakerIcon,
  Dna2Icon,
  Dna2OffIcon,
  DnaIcon,
  DnaOffIcon,
  FlaskConicalIcon,
  FlaskConicalOffIcon,
  FlaskRoundIcon,
  MagnetIcon,
  MicroscopeIcon,
  OrbitIcon,
  TelescopeIcon,
  TestTube2Icon,
  TestTubeIcon
});
