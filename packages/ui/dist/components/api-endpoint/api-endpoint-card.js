"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainCard } from "../../internal/domain.js";
import { config } from "./config.js";
function ApiEndpointCard(props) {
  return /* @__PURE__ */ jsx(DomainCard, { config, ...props });
}
export {
  ApiEndpointCard
};
