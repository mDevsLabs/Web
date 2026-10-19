declare module 'markdown-it-mark' {
  import type { MarkdownIt } from 'markdown-it';
  const markPlugin: (md: MarkdownIt) => void;
  export default markPlugin;
}
