"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainTable } from "../../internal/domain.js";
import { config } from "./config.js";
function InventoryTable(props) {
  return /* @__PURE__ */ jsx(DomainTable, { config, ...props });
}
export {
  InventoryTable
};
