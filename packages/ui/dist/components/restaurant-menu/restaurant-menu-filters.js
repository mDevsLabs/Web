"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainFilters } from "../../internal/domain.js";
import { config } from "./config.js";
function RestaurantMenuFilters({ onStatusChange, ...props }) {
  return /* @__PURE__ */ jsx(DomainFilters, { config, ...props, onStatusChange: onStatusChange ? (value) => onStatusChange(value) : void 0 });
}
export {
  RestaurantMenuFilters
};
