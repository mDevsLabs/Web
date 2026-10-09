"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainTable } from "../../internal/domain.js";
import { config } from "./config.js";
function CouponTable(props) {
  return /* @__PURE__ */ jsx(DomainTable, { config, ...props });
}
export {
  CouponTable
};
