"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainStats } from "../../internal/domain.js";
import { config } from "./config.js";
function RestaurantMenuStats(props) {
  return /* @__PURE__ */ jsx(DomainStats, { config, ...props });
}
export {
  RestaurantMenuStats
};
