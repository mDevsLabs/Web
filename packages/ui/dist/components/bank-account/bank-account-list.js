"use client";
"use client";
import { jsx } from "react/jsx-runtime";
import { DomainList } from "../../internal/domain.js";
import { config } from "./config.js";
function BankAccountList({ onSelect, ...props }) {
  return /* @__PURE__ */ jsx(DomainList, { config, ...props, onSelect: onSelect ? (item) => onSelect(item) : void 0 });
}
export {
  BankAccountList
};
