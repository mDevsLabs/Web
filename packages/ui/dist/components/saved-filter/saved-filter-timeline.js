"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainTimeline } from "../../internal/domain.js";
import { config } from "./config.js";
function SavedFilterTimeline(props) {
  return /* @__PURE__ */ jsx(DomainTimeline, { config, ...props });
}
export {
  SavedFilterTimeline
};
