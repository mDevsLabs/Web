import {
  type ReactNode,
  type TransitionEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Props = {
  open: boolean;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  durationMs?: number;
};

export function AnimatedHeightReveal({
  open,
  children,
  className,
  innerClassName,
  durationMs = 240,
}: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const [heightPx, setHeightPx] = useState<number | null>(open ? null : 0);
  const [shouldRender, setShouldRender] = useState(open);
  const [animating, setAnimating] = useState(false);
  const firstRenderRef = useRef(true);

  const clearFallback = () => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      setShouldRender(open);
      setHeightPx(open ? null : 0);
      return;
    }

    if (open && !shouldRender) {
      setShouldRender(true);
      setHeightPx(0);
      return;
    }

    const inner = innerRef.current;
    if (!inner || !shouldRender) {
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const currentHeight = shell.getBoundingClientRect().height;
    const targetHeight = open ? inner.getBoundingClientRect().height : 0;

    setAnimating(true);
    setHeightPx(currentHeight);

    rafRef.current = requestAnimationFrame(() => {
      setHeightPx(targetHeight);
      rafRef.current = null;
    });
    // Fallback: si transitionend ne fire jamais (toggle rapide), débloque après duration+50ms.
    clearFallback();
    fallbackTimerRef.current = window.setTimeout(() => {
      fallbackTimerRef.current = null;
      setAnimating(false);
      if (open) {
        setHeightPx(null);
      } else {
        setHeightPx(0);
        setShouldRender(false);
      }
    }, durationMs + 50);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      clearFallback();
    };
  }, [open, shouldRender, durationMs]);

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== shellRef.current || event.propertyName !== "height") {
      return;
    }
    clearFallback();
    setAnimating(false);
    if (open) {
      setHeightPx(null);
      return;
    }
    setHeightPx(0);
    setShouldRender(false);
  };

  return (
    <div
      className={[
        "ref-animated-height-reveal",
        open && "is-open",
        animating && "is-animating",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onTransitionEnd={onTransitionEnd}
      ref={shellRef}
      style={{
        height: heightPx == null ? "auto" : `${heightPx}px`,
        transitionDuration: `${durationMs}ms`,
      }}
    >
      {shouldRender ? (
        <div
          className={["ref-animated-height-reveal-inner", innerClassName]
            .filter(Boolean)
            .join(" ")}
          ref={innerRef}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
