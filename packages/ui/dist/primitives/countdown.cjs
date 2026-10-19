"use client";
"use strict";
"use client";
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
var countdown_exports = {};
__export(countdown_exports, {
  Countdown: () => Countdown
});
module.exports = __toCommonJS(countdown_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function Countdown({ seconds, label = "Temps restant", onElapsed, className, ...props }) {
  const [remaining, setRemaining] = (0, import_react.useState)(() => Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0)));
  const latest = (0, import_react.useRef)(onElapsed);
  (0, import_react.useEffect)(() => {
    latest.current = onElapsed;
  }, [onElapsed]);
  (0, import_react.useEffect)(() => {
    let value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    setRemaining(value);
    if (!value)
      return;
    const timer = setInterval(() => {
      value -= 1;
      setRemaining(value);
      if (value <= 0) {
        clearInterval(timer);
        latest.current?.();
      }
    }, 1e3);
    return () => clearInterval(timer);
  }, [seconds]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { ...props, role: "timer", "aria-label": label, "aria-live": "off", className: (0, import_utils.cx)("md-countdown", className), children: [
    Math.floor(remaining / 60).toString().padStart(2, "0"),
    ":",
    (remaining % 60).toString().padStart(2, "0")
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Countdown
});
