/**
 * Logo mAI Coder : utilise public/logo.png (M multicolore) partout.
 */
const iconUrl = new URL("../public/logo.png", import.meta.url).href;

export function BrandLogo({
  className,
  size = 22,
  "aria-label": ariaLabel,
}: {
  className?: string;
  size?: number;
  "aria-label"?: string;
}) {
  return (
    <img
      alt={ariaLabel ?? "mAI Coder"}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={className}
      draggable={false}
      height={size}
      role={ariaLabel ? "img" : undefined}
      src={iconUrl}
      style={{ display: "inline-block", objectFit: "contain" }}
      width={size}
    />
  );
}
