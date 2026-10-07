"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainOverview } from "../../internal/domain.js";
import { config } from "./config.js";
function CalendarOverview(props) {
  return /* @__PURE__ */ jsx(DomainOverview, { config, ...props });
}
export {
  CalendarOverview
};
