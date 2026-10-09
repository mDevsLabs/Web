import { useEffect, useState } from "react";
import { type EffectiveColorScheme, readDomColorScheme } from "./colorMode";

export function useDomColorScheme(): EffectiveColorScheme {
  const [scheme, setScheme] = useState<EffectiveColorScheme>(() =>
    readDomColorScheme()
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const sync = () => {
      setScheme((current) => {
        const next = readDomColorScheme();
        return current === next ? current : next;
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributeFilter: ["data-color-scheme"],
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  return scheme;
}
