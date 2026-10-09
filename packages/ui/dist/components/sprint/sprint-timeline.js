"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainTimeline } from "../../internal/domain.js";
import { config } from "./config.js";
function SprintTimeline(props) {
  return /* @__PURE__ */ jsx(DomainTimeline, { config, ...props });
}
export {
  SprintTimeline
};
