"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainSettings } from "../../internal/domain.js";
import { config } from "./config.js";
function SprintSettings({ onChange, ...props }) {
  return /* @__PURE__ */ jsx(DomainSettings, { config, ...props, onChange: (key, value) => onChange(key, value) });
}
export {
  SprintSettings
};
