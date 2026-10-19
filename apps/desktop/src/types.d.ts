// Déclarations de types pour les modules natifs et tiers de mAI Desktop

declare module "node-pty" {
  export interface IPty {
    readonly pid: number;
    readonly cols: number;
    readonly rows: number;
    readonly process: string;
    onData(listener: (data: string) => void): { dispose(): void };
    onExit(listener: (e: { exitCode: number; signal?: number }) => void): { dispose(): void };
    write(data: string): void;
    resize(columns: number, rows: number): void;
    kill(signal?: string): void;
  }

  export interface IPtyForkOptions {
    name?: string;
    cols?: number;
    rows?: number;
    cwd?: string;
    env?: { [key: string]: string | undefined };
    encoding?: string | null;
  }

  export function spawn(file: string, args: string[] | string, options: IPtyForkOptions): IPty;
}
