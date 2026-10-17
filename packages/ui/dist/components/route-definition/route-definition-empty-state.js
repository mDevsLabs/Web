"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainEmptyState } from "../../internal/domain.js";
import { config } from "./config.js";
function RouteDefinitionEmptyState(props) {
  return /* @__PURE__ */ jsx(DomainEmptyState, { config, ...props });
}
export {
  RouteDefinitionEmptyState
};
