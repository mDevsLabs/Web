"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainCard } from "../../internal/domain.js";
import { config } from "./config.js";
function IssueCard(props) {
  return /* @__PURE__ */ jsx(DomainCard, { config, ...props });
}
export {
  IssueCard
};
