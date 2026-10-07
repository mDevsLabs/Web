"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainOverview } from "../../internal/domain.js";
import { config } from "./config.js";
function CandidateOverview(props) {
  return /* @__PURE__ */ jsx(DomainOverview, { config, ...props });
}
export {
  CandidateOverview
};
