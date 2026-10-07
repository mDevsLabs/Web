// Contrat partagé par le terminal local et son preload ; aucun accès système ici.
export type CliState = {
  maiInstalled: boolean;
  npmInstalled: boolean;
  nodeInstalled: boolean;
  running: boolean;
  installing: boolean;
  error?: string;
};
export type CliTerminalBridge = {
  start: () => Promise<CliState>;
  install: () => Promise<CliState>;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  onData: (listener: (data: string) => void) => () => void;
  onState: (listener: (state: CliState) => void) => () => void;
  openHelp: () => Promise<void>;
};
