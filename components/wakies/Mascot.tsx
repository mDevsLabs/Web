"use client";

const characters = ["blue", "mint", "orange", "purple", "red"] as const;

/** Stable identity keeps each specialist recognizable across views and reloads. */
function characterFor(identity?: string) {
  if (!identity) return characters[0];
  let hash = 0;
  for (const character of identity)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return characters[hash % characters.length];
}

export function Mascot({
  state = "idle",
  small = false,
  identity,
  name = "Wakie",
  decorative = false,
}: {
  state?: string;
  small?: boolean;
  identity?: string;
  name?: string;
  decorative?: boolean;
}) {
  return (
    <span className={`mascot ${state} ${small ? "small" : ""}`}>
      <img
        alt={decorative ? "" : `${name} is ${state}`}
        className="dot-body"
        draggable={false}
        height={512}
        src={`/wakies/${characterFor(identity)}.png`}
        width={512}
      />
    </span>
  );
}
