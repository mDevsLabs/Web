export function debugDiffHead(diff: string, max = 160): string {
  return diff.replace(/\s+/g, " ").slice(0, max);
}

export function diffCreatesNewFile(diff: string | null | undefined): boolean {
  const text = String(diff ?? "");
  return /^new file mode\s/m.test(text) || /^---\s+\/dev\/null$/m.test(text);
}

export function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
