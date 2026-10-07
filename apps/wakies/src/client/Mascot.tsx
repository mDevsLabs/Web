const characters = ['blue', 'mint', 'orange', 'purple', 'red'] as const;

/** Stable identity keeps each specialist recognizable across views and reloads. */
function characterFor(identity?: string) {
  if (!identity) return characters[0];
  let hash = 0;
  for (const character of identity)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return characters[hash % characters.length];
}

export function Mascot({
  state = 'idle',
  small = false,
  identity,
  name = 'Wakie',
  decorative = false,
}: {
  state?: string;
  small?: boolean;
  identity?: string;
  name?: string;
  decorative?: boolean;
}) {
  return (
    <span className={`mascot ${state} ${small ? 'small' : ''}`}>
      <img
        className="dot-body"
        src={`/wakies/${characterFor(identity)}.PNG`}
        alt={decorative ? '' : `${name} is ${state}`}
        width={512}
        height={512}
        draggable={false}
      />
    </span>
  );
}
